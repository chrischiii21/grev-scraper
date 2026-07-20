#!/usr/bin/env bash
# ===========================================
# Generic weekly Google Reviews scraper runner - reusable across any
# client site built on this template. Reads .github/scripts/config.json
# (per-repo, not a template - copy config.example.json to config.json and
# fill in the business first) and runs gosom/google-maps-scraper in
# Docker, writing newline-delimited JSON to output/results.ndjson.
#
# Uses a locally-built, patched image (see build-scraper-image.sh and
# patches/full-review-text.patch) rather than pulling gosom/google-maps-scraper
# from Docker Hub, for two independent reasons:
#
# 1. The default Playwright-based image is currently broken upstream: as of
#    2026-07, its driver download 404s against every version on
#    playwright.azureedge.net (an active, unrelated Microsoft CDN migration
#    issue - see https://github.com/microsoft/playwright/issues/38052). The
#    -rod backend (go-rod) doesn't depend on that CDN at all, so the image
#    is built from source with the "-rod" build tag.
# 2. Both upstream images (Playwright and -rod) have a real bug: they click
#    Google's "Read more" toggle on long reviews, then read the text in the
#    same synchronous instant - before Google's async expand-fetch resolves
#    - so long reviews come back truncated ("...") every single run,
#    deterministically. patches/full-review-text.patch fixes this by
#    waiting (polling, up to two ~10s rounds - re-clicking between rounds -
#    so ~20s worst case) for the expansion to actually land before reading.
#    The expand-fetch latency varies run to run, so a short fixed wait isn't
#    reliable; this was verified clean across multiple consecutive real
#    scrapes: 8/8 reviews came back full every time, vs. 4/8 truncated with
#    the unpatched image.
#
# Re-check periodically whether the upstream default image's CDN issue gets
# fixed and whether they ever fix the truncation bug themselves - either
# would let this go back to a plain `docker pull`.
#
# Usable both in CI (scrape-reviews.yml) and locally for testing:
#   bash .github/scripts/run-scraper.sh
# ===========================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
OUT_DIR="$SCRIPT_DIR/output"
CONFIG_FILE="$SCRIPT_DIR/config.json"
QUERIES_FILE="$SCRIPT_DIR/queries.txt"
IMAGE_TAG="local/google-maps-scraper:patched-rod"

# Config is read via a relative path (config.json, after cd above) rather
# than the absolute $SCRIPT_DIR - on Windows Git Bash, $SCRIPT_DIR is a
# POSIX-style path (e.g. /c/Users/...) that Node's require() can't resolve
# natively. A relative path works identically on Linux, macOS, and Windows.
if [ ! -f "$CONFIG_FILE" ]; then
  echo "[run-scraper] missing $CONFIG_FILE - copy config.example.json to config.json and fill in this business" >&2
  exit 1
fi

QUERY=$(node -e "const c = require('./config.json'); process.stdout.write(c.query || '')")
if [ -z "$QUERY" ]; then
  echo "[run-scraper] config.json is missing a non-empty \"query\" field" >&2
  exit 1
fi
DEPTH=$(node -e "const c = require('./config.json'); process.stdout.write(String(c.depth || 1))")
INACTIVITY=$(node -e "const c = require('./config.json'); process.stdout.write(c.exitOnInactivity || '3m')")

mkdir -p "$OUT_DIR"
printf '%s\n' "$QUERY" > "$QUERIES_FILE"

# MSYS_NO_PATHCONV avoids Git Bash on Windows mangling the container-side
# "/queries.txt" and "/out" paths below as if they were host paths. It's a
# no-op on Linux/macOS and in GitHub Actions.
export MSYS_NO_PATHCONV=1

if ! docker image inspect "$IMAGE_TAG" >/dev/null 2>&1; then
  echo "[run-scraper] $IMAGE_TAG not found locally, building it first"
  bash "$SCRIPT_DIR/build-scraper-image.sh"
fi

docker run --rm \
  -v "$QUERIES_FILE:/queries.txt:ro" \
  -v "$OUT_DIR:/out" \
  "$IMAGE_TAG" \
  -input /queries.txt \
  -json \
  -results /out/results.ndjson \
  -extra-reviews \
  -depth "$DEPTH" \
  -exit-on-inactivity "$INACTIVITY"

echo "[run-scraper] wrote $OUT_DIR/results.ndjson"
