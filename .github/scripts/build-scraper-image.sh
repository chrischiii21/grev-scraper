#!/usr/bin/env bash
# ===========================================
# Builds a patched gosom/google-maps-scraper Docker image from source.
#
# The upstream image (both the default Playwright build and the -rod
# variant) has a real bug: it clicks Google's "Read more" toggle on long
# reviews, then reads the review text in the same synchronous instant -
# before Google's async text-expansion fetch resolves - so any review
# needing that fetch is captured mid-truncation, every single run,
# deterministically (confirmed by scraping the same business twice and
# getting byte-identical truncated output both times).
#
# patches/full-review-text.patch fixes this: it splits the click and the
# read into two separate browser Eval calls with a real wait (polling, up
# to two ~10s rounds - re-clicking between rounds - so ~20s worst case) in
# between, so the expansion actually has time to land before the text is
# read. The expand-fetch latency varies run to run, so a short fixed wait
# isn't reliable; this was verified clean across multiple consecutive real
# scrapes against a real business: 8/8 reviews came back full every time
# (previously 4/8 truncated with the unpatched image).
#
# This script clones gosom/google-maps-scraper at the pinned tag, applies
# the patch, and builds the image locally via their own Dockerfile.rod (the
# -rod backend still avoids the separate, unrelated Playwright CDN issue
# documented in run-scraper.sh). Building from source - rather than
# committing gosom's full source tree into this repo - keeps this repo's
# footprint small while staying fully reproducible and auditable: anyone
# can diff patches/full-review-text.patch against the pinned upstream tag
# and see exactly what changed.
# ===========================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOSOM_TAG="v1.11.1"
IMAGE_TAG="local/google-maps-scraper:patched-rod"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

echo "[build-scraper-image] cloning gosom/google-maps-scraper@$GOSOM_TAG..."
git clone --quiet --depth 1 --branch "$GOSOM_TAG" https://github.com/gosom/google-maps-scraper.git "$BUILD_DIR"

echo "[build-scraper-image] applying full-review-text.patch..."
git -C "$BUILD_DIR" apply "$SCRIPT_DIR/patches/full-review-text.patch"

echo "[build-scraper-image] building $IMAGE_TAG (a few minutes: Go build + Chromium download)..."
docker build -f "$BUILD_DIR/Dockerfile.rod" -t "$IMAGE_TAG" "$BUILD_DIR"

echo "[build-scraper-image] built $IMAGE_TAG"
