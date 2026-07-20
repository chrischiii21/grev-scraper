# Google Reviews Scraper — Implementation Spec

Self-hosted, config-driven weekly scrape of a business's Google reviews via
Docker (`gosom/google-maps-scraper`), committed straight into the repo as a
static JSON asset. No paid API (SerpApi/Serper), no API keys.

This file is written to be handed to an implementer (human or AI agent) cold
and followed top to bottom. Every file below is the exact, already-tested
content — copy it verbatim except where a step says to fill something in.

**Reuse prompt** (for bootstrapping this in a new repo):
> Read through `docs/Scraper-Implementation.md` in full, then implement the
> Google Reviews scraper for this repo exactly as it describes. If no
> reviews UI section exists yet, build one that matches this repo's
> existing design system and place it on the homepage. Ask me for the
> business name/city if you don't already know it, and verify the pipeline
> works locally (Docker scrape → transform → validate) before considering
> it done.

---

## 1. Prerequisites

- Docker Desktop installed and running (the scraper runs in a container —
  nothing to install on the host beyond Docker itself).
- Node.js available (the transform script and config parsing use it).
- A GitHub repo with Actions enabled and push access, since the workflow
  commits results back to `main`.

## 2. The contract this assumes

This spec assumes an Astro site where a component imports a static JSON file
shaped like this:

```json
{
  "fetchedAt": "2026-07-20T03:11:07.847Z",
  "rating": 5,
  "totalReviews": 8,
  "reviewsUrl": "https://search.google.com/local/reviews?placeid=...",
  "writeReviewUrl": "https://g.page/r/XXXXXXXXXXXXXXXX/review",
  "reviews": [
    {
      "author": "Jane Doe",
      "avatar": "https://lh3.googleusercontent.com/...",
      "rating": 5,
      "date": "a month ago",
      "isoDate": "",
      "text": "Great service...",
      "link": "https://www.google.com/maps?cid=..."
    }
  ]
}
```

In the reference implementation this file is `src/data/settings/reviews.json`,
imported directly by `src/components/widgets/GoogleReviews.astro`.

**If the target repo's reviews component expects a different path or shape**,
find it first (`grep -ri "reviews" src/` or equivalent) and adjust the
`PUBLISH_PATH` in step 4.5 and the `payload` shape in step 4.3 to match — do
not change the component to match this spec, change this spec's output to
match the component.

## 3. UI: reuse the existing reviews section, or build one

Run `grep -ril "review" src/components src/data 2>/dev/null` first.

### 3.1 If a reviews-displaying component already exists

Adopt its exact prop/JSON contract as-is (section 2) — don't restyle or
restructure it. Just confirm it's actually placed on the **homepage**: check
the homepage's page-data file (or the homepage route directly) for a
reference to it. If it's missing, add it — see 3.2's placement guidance (item 5).

### 3.2 If none exists, build one — matching this repo's design system, not a generic one

1. **Find the composition pattern.** Many sites built on this template use a
   data-driven section system: a dispatcher component (here,
   `src/components/SectionRenderer.astro`) that switches on a
   `{ "section": "Name", ... }` object and renders the matching widget from
   `src/components/widgets/`, fed by a per-page JSON file (here,
   `src/data/pages/home.json`) containing an ordered array of these section
   objects. If the target repo has this pattern, follow it. If it's a plainer
   Astro site with components composed directly in `src/pages/index.astro`,
   skip the dispatcher/registry steps below and just add the new component
   there directly, in a sensible position among the existing sections.

2. **Study 2-3 existing homepage sections before writing any markup.** Pull
   their exact utility classes for: container width/padding, heading and
   body type scale, color tokens (look for CSS custom properties like
   `var(--brand-dark)` / `var(--brand-secondary)` rather than raw hex —
   reuse whatever token names the repo already defines), card/border/shadow
   treatment, and background alternation between sections. Do not invent new
   spacing or type scales — reuse exactly what's already there.

3. **Build the component to accept the same prop shape as sibling
   sections** (in this template family: `eyebrow`, `title`, `description`,
   `ctaText`, optionally `background`) so it composes the same way through
   the dispatcher/page-data system.

4. **Guard against empty data.** The reviews JSON won't exist with real
   content until the first scrape runs. Render nothing (not a broken
   section) when the array is empty:
   ```astro
   {reviews.length > 0 && (
     <section>...</section>
   )}
   ```

5. **Register and place it — same relative position on every site.** If
   using the dispatcher pattern: add an `import` and a
   `{s.section === "GoogleReviews" && (...)}` branch to the dispatcher, then
   add a `{ "section": "GoogleReviews", "eyebrow": ..., "order": N }` entry
   to the homepage's page-data file. **The fixed rule, not just a suggestion:
   place it immediately before the homepage's primary CTA/call-to-action
   section**, wherever that falls in that homepage's own flow — regardless
   of what comes after it (FAQs, a map, etc.). This exact relative position
   is what should stay consistent across every site built on this template,
   not just "somewhere near the end." If not using the dispatcher pattern,
   insert the component directly into the homepage file at the equivalent
   spot: right before whichever section is that page's main conversion CTA.

**Reference implementation** (this repo). Full homepage order in
`src/data/pages/home.json`: Hero → ServicesGrid → ContentWithKeypoints →
BoostVisibility → ContentWithImage → **GoogleReviews** → CTABanner → FAQs →
Map. Reviews sits at position 6 of 9 — immediately after the last
content/features section and immediately before `CTABanner` (the primary
CTA), even though FAQs and Map follow afterward. Reproduce this same
relative slot — "last piece of social proof right before the ask" — on
every site, not the literal order number.

Component styling (`src/components/widgets/GoogleReviews.astro`): section
wrapper `class="relative py-16 md:py-20 bg-light overflow-hidden"`, inner
`class="container px-4 sm:px-6 lg:px-8 mx-auto"` with a
`max-w-[1240px] mx-auto"` content width, eyebrow pill
`class="inline-block px-5 py-2 rounded-full bg-[var(--brand-dark)] text-white text-xs md:text-sm font-bold uppercase tracking-wider"`,
heading `class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-balance"`,
description `class="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto"`,
cards `class="bg-white rounded-2xl border border-gray-200 p-6 md:p-7"`, CTA
links styled `class="text-[var(--brand-secondary)]"`. Registered in
`SectionRenderer.astro`. Use this as a concrete pattern to match when the
target repo shares this template family; treat it only as an example (not
something to copy verbatim) when it doesn't.

## 4. Implementation steps

### 4.1 Create the directories

```
.github/scripts/
.github/scripts/patches/
.github/workflows/
```

### 4.2 `.github/scripts/config.example.json`

The reusable template. Commit this as-is in every repo built from this spec.

```json
{
  "query": "Your Business Name, City, State",
  "cid": "",
  "writeReviewUrl": "",
  "depth": 1,
  "exitOnInactivity": "3m"
}
```

Then create `.github/scripts/config.json` as a copy of it — this is the
per-repo real config (see step 5 to fill it in). It contains no secrets
(just public Google Maps info), so it's fine to commit.

### 4.3 `.github/scripts/transform-reviews.mjs`

```js
// ===========================================
// TRANSFORM SCRAPER OUTPUT -> ASTRO REVIEWS SHAPE
// Generic across any client site built on this template. Reads
// .github/scripts/config.json for this repo's business identity, reads
// the newline-delimited JSON produced by gosom/google-maps-scraper
// (.github/scripts/output/results.ndjson), and writes a staged file
// (.github/scripts/output/reviews.staged.json) matching the shape
// src/components/widgets/GoogleReviews.astro expects.
//
// The scraper's `Review` struct mixes json-tagged fields (e.g. text_original)
// with untagged Go fields that serialize using their capitalized field name
// (e.g. Name, Description). Exact casing isn't fully documented upstream, so
// every field is resolved by trying several candidate keys.
// ===========================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "output");
const IN_FILE = resolve(OUT_DIR, "results.ndjson");
const STAGED_FILE = resolve(OUT_DIR, "reviews.staged.json");
const CONFIG_FILE = resolve(__dirname, "config.json");

if (!existsSync(CONFIG_FILE)) {
  throw new Error(
    `missing ${CONFIG_FILE} - copy config.example.json to config.json and fill in this business`,
  );
}
const config = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
if (!config.query) {
  throw new Error('config.json is missing a non-empty "query" field');
}

const FALLBACK_REVIEWS_URL = config.cid ? `https://www.google.com/maps?cid=${config.cid}` : "";

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toIsoDate(review) {
  const published = pick(review, "published_at", "PublishedAt");
  if (published) {
    const d = new Date(published);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const micros = pick(review, "posted_at_unix_micros", "PostedAtUnixMicros");
  if (micros) {
    const d = new Date(Number(micros) / 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return "";
}

function mapReview(review, reviewsUrl) {
  return {
    author: pick(review, "Name", "name", "author") ?? "",
    avatar: pick(review, "ProfilePicture", "profile_picture", "avatar") ?? "",
    rating: Number(pick(review, "Rating", "rating", "rating_float", "RatingFloat") ?? 0),
    date: pick(review, "When", "when", "relative_date") ?? "",
    isoDate: toIsoDate(review),
    text: pick(review, "text_original", "TextOriginal", "Description", "description", "text") ?? "",
    link: pick(review, "author_url", "AuthorURL") ?? reviewsUrl,
  };
}

// queries.txt is a text search, so results.ndjson can contain several
// loosely-matched businesses. If config.cid is set, match strictly.
// Otherwise fall back to a best-effort title match and log every
// candidate so the correct cid can be copied into config.json.
function selectEntry(entries) {
  if (config.cid) {
    const match = entries.find((e) => e.cid === config.cid);
    if (!match) {
      throw new Error(
        `no entry with cid ${config.cid} found among ${entries.length} scraped result(s): ` +
          entries.map((e) => `${e.title} (${e.cid})`).join(", "),
      );
    }
    return match;
  }

  console.warn('[transform-reviews] no "cid" set in config.json - matching by title as a best effort.');
  console.warn("[transform-reviews] scraped candidates:");
  for (const e of entries) {
    console.warn(`  - ${e.title} (cid: ${e.cid}, reviews: ${e.review_count})`);
  }
  const queryLower = config.query.toLowerCase();
  const byTitle = entries.find((e) => e.title && queryLower.includes(e.title.toLowerCase()));
  const chosen = byTitle ?? entries[0];
  console.warn(
    `[transform-reviews] selected "${chosen.title}" (cid: ${chosen.cid}). ` +
      `If this is wrong, set "cid" to the correct value above in config.json.`,
  );
  return chosen;
}

function main() {
  if (!existsSync(IN_FILE)) {
    throw new Error(`scraper output not found: ${IN_FILE}`);
  }

  const lines = readFileSync(IN_FILE, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("scraper output is empty");
  }

  const entries = lines.map((l) => JSON.parse(l));
  const entry = selectEntry(entries);
  const reviewsUrl = entry.reviews_link || entry.link || FALLBACK_REVIEWS_URL;

  const rawReviews = entry.user_reviews_extended?.length
    ? entry.user_reviews_extended
    : entry.user_reviews ?? [];

  if (rawReviews.length) {
    console.log("[transform-reviews] sample review keys:", Object.keys(rawReviews[0]).join(", "));
  }

  const reviews = rawReviews
    .map((r) => mapReview(r, reviewsUrl))
    .filter((r) => r.author && r.text);

  if (!reviews.length) {
    throw new Error("no reviews mapped from scraper output - check sample review keys logged above");
  }

  const rating =
    entry.review_rating ??
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  const payload = {
    fetchedAt: new Date().toISOString(),
    rating,
    totalReviews: entry.review_count ?? reviews.length,
    reviewsUrl,
    writeReviewUrl: config.writeReviewUrl || reviewsUrl,
    reviews,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(STAGED_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[transform-reviews] staged ${reviews.length} reviews (rating ${rating}, total ${payload.totalReviews})`);
}

main();
```

### 4.4 `.github/scripts/run-scraper.sh`, `build-scraper-image.sh`, and the patch

This spec uses a **locally-built, patched** image, not a `docker pull` of
`gosom/google-maps-scraper`, for two independent upstream reasons:

1. The default Playwright-based image is currently broken: as of 2026-07 its
   driver download 404s against every version on `playwright.azureedge.net`
   (an active, unrelated Microsoft CDN migration issue — see
   https://github.com/microsoft/playwright/issues/38052). Building with the
   `-rod` (go-rod) backend instead routes around it entirely.
2. Both upstream images (Playwright and `-rod`) have a real, deterministic
   bug: they click Google's "Read more" toggle on a long review, then read
   the text in the *same synchronous instant* — before Google's async
   expand-fetch resolves — so long reviews come back truncated (`…`) every
   single run. Confirmed by scraping the same business twice and getting
   byte-identical truncated output both times, which rules out a simple
   retry/flakiness explanation. `patches/full-review-text.patch` fixes this
   at the Go level: it splits the click and the text-read into two separate
   browser `Eval` calls with a real wait in between (polling, up to two
   ~10s rounds — re-clicking between rounds — so ~20s worst case), giving
   the expansion real wall-clock time to land before reading. A short fixed
   wait isn't reliable because the expand-fetch latency genuinely varies
   run to run; this was verified clean across multiple consecutive scrapes
   against a real business: 8/8 reviews came back full every time, vs. 4/8
   truncated with the unpatched image.

`build-scraper-image.sh` clones `gosom/google-maps-scraper` at a pinned tag
into a temp dir, applies the patch, and builds the image from the cloned
repo's own `Dockerfile.rod` — building from source rather than vendoring
gosom's full source tree keeps this repo's footprint small while staying
fully reproducible: anyone can diff the patch against the pinned tag and see
exactly what changed. `run-scraper.sh` builds this image automatically the
first time it's needed (first local run, first CI run) — nothing to run
manually.

```bash
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
```

`.github/scripts/patches/full-review-text.patch` — a `git diff` against
`gmaps/reviews.go` at the pinned tag, verified to `git apply` cleanly
against a fresh clone:

```diff
diff --git a/gmaps/reviews.go b/gmaps/reviews.go
index 7a8b737..4dec11b 100644
--- a/gmaps/reviews.go
+++ b/gmaps/reviews.go
@@ -424,6 +424,64 @@ func extractReviewsFromPage(ctx context.Context, page scrapemate.BrowserPage) ([
 		default:
 		}
 
+		clickMoreButtons := func() {
+			_, _ = page.Eval(`() => {
+				try {
+					const moreButtons = document.querySelectorAll('.w8nwRe, button[aria-label*="More"], button[aria-expanded="false"]');
+					for (const btn of moreButtons) {
+						try { btn.click(); } catch (e) {}
+					}
+				} catch (e) {}
+			}`)
+		}
+
+		countTruncated := func() float64 {
+			remaining, _ := page.Eval(`() => {
+				try {
+					return Array.from(document.querySelectorAll('.wiI7pd'))
+						.filter(el => /…\s*$/.test(el.textContent || '')).length;
+				} catch (e) {
+					return 0;
+				}
+			}`)
+			n, _ := remaining.(float64)
+			return n
+		}
+
+		// Click every "More" button first and give Google's async text-expansion
+		// fetch real wall-clock time to resolve, in a *separate* Eval call and a
+		// real Go-level sleep - not a synchronous click-then-immediately-read in
+		// the same JS call, which never observes the expanded text because the
+		// underlying browser driver's Eval here does not await returned promises
+		// for plain function expressions (see go-rod EvalOptions.ByPromise).
+		//
+		// The expand-fetch latency is genuinely variable (observed anywhere from
+		// under 500ms to over 4s across otherwise-identical runs against the
+		// same business), so this polls for up to ~10s, and if anything is
+		// still truncated after that, re-clicks and polls once more (some
+		// clicks land on a button before its handler has fully attached after
+		// a DOM re-render, so a second attempt can pick up stragglers) for
+		// another ~10s before giving up.
+		clickMoreButtons()
+		for round := 0; round < 2; round++ {
+			var remainingN float64
+			for pollAttempt := 0; pollAttempt < 20; pollAttempt++ {
+				time.Sleep(500 * time.Millisecond)
+				remainingN = countTruncated()
+				if remainingN <= 0 {
+					break
+				}
+			}
+			if remainingN <= 0 {
+				break
+			}
+			if round == 0 {
+				clickMoreButtons()
+			} else {
+				log.Printf("Review expansion: %v review(s) still truncated after two full wait rounds", remainingN)
+			}
+		}
+
 		// Extract reviews from the DOM - updated for Dec 2025 Google Maps structure
 		reviewsJSON, err := page.Eval(`() => {
 			try {
@@ -559,11 +617,8 @@ func extractReviewsFromPage(ctx context.Context, page scrapemate.BrowserPage) ([
 						];
 						let text = '';
 
-						// First try to click "More" button to expand text
-						const moreButtons = element.querySelectorAll('.w8nwRe, button[aria-label*="More"], button[aria-expanded="false"]');
-						for (const btn of moreButtons) {
-							try { btn.click(); } catch(e) {}
-						}
+						// "More" buttons were already clicked, with a real wait, before
+						// this extraction pass ran (see the Eval call above this loop).
 
 						for (const sel of textSelectors) {
 							const textEl = element.querySelector(sel);
```

`.github/scripts/run-scraper.sh`:

```bash
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
```

> `queries.txt` is written by this script every run — it's generated from
> `config.json`, never hand-edited, and should be gitignored (step 4.6).
> **Do not** put a direct Google Maps URL (e.g. `?cid=...`) in `config.json`'s
> `query` field — the scraper treats it as literal search text rather than
> navigating to it, which breaks the scrape. Use plain text: business name +
> city.

### 4.5 `.github/workflows/scrape-reviews.yml`

```yaml
name: Scrape Google Reviews

on:
  schedule:
    - cron: "0 6 * * 1" # every Monday 06:00 UTC
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  scrape:
    runs-on: ubuntu-latest
    # The scraper image is built from source each run (see run-scraper.sh /
    # build-scraper-image.sh) rather than pulled, so this needs headroom
    # for a Go build + Chromium download on top of the scrape itself.
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run scraper
        run: bash .github/scripts/run-scraper.sh

      - name: Transform to Astro shape
        run: node .github/scripts/transform-reviews.mjs

      - name: Validate output
        run: |
          test -s .github/scripts/output/reviews.staged.json
          node -e "
            const fs = require('fs');
            const d = JSON.parse(fs.readFileSync('.github/scripts/output/reviews.staged.json', 'utf8'));
            if (!Array.isArray(d.reviews) || d.reviews.length === 0) { throw new Error('no reviews in output'); }
            console.log('validated', d.reviews.length, 'reviews');
          "

      - name: Publish + commit
        run: |
          cp .github/scripts/output/reviews.staged.json src/data/settings/reviews.json
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/settings/reviews.json
          if git diff --cached --quiet; then
            echo "No review changes."
          else
            git commit -m "chore: update Google reviews"
            git push
          fi
```

`ubuntu-latest` runners have Docker preinstalled — no extra setup step
needed. Replace the `cp` target path in "Publish + commit" if this repo's
reviews contract lives somewhere other than `src/data/settings/reviews.json`
(see step 2).

### 4.6 `.gitignore` additions

```gitignore
# raw google-maps-scraper output (staged before validation, not committed)
.github/scripts/output/
# generated at scrape time from config.json - not hand-maintained
.github/scripts/queries.txt
```

### 4.7 `.github/scripts/README.md`

Create this too — it's the short in-repo operator reference for whoever
maintains this specific site afterward (onboarding a new business, field
reference, why the image is built from source). Content:

```markdown
# Google Reviews scraper

Scrapes this business's Google reviews weekly via a locally-built, patched
Docker image (based on `gosom/google-maps-scraper`) and writes
`src/data/settings/reviews.json`, which
`src/components/widgets/GoogleReviews.astro` renders directly. Runs on a
schedule via `.github/workflows/scrape-reviews.yml`.

The image is built from source each run rather than pulled from Docker Hub
(`build-scraper-image.sh`, `patches/full-review-text.patch`) - see "Why a
patched image" below for why.

## Setting this up for a new client site

1. Copy the template: `cp config.example.json config.json`
2. Fill in `query` with the business name and city, e.g.
   `"Acme Roofing, Austin, TX"`. This is the only required field.
3. Run it once without a `cid`:
   \`\`\`
   bash .github/scripts/run-scraper.sh
   node .github/scripts/transform-reviews.mjs
   \`\`\`
   The transform step logs every business it found for that search, e.g.:
   \`\`\`
   [transform-reviews] scraped candidates:
     - Acme Roofing (cid: 1234567890123456789, reviews: 42)
     - Acme Roofing & Gutters (cid: 9876543210987654321, reviews: 3)
   [transform-reviews] selected "Acme Roofing" (cid: 1234567890123456789).
   \`\`\`
4. Copy the correct `cid` from that log into `config.json`. From then on the
   business is matched exactly, instead of by best-effort title guessing.
5. Optionally set `writeReviewUrl` to the client's own short review link
   (Google Business Profile → Get more reviews → Share review form link,
   looks like `https://g.page/r/XXXXXXXXXXXXXXXX/review`). If left blank, the
   "leave a review" CTA falls back to the general reviews listing link.
6. Commit `config.json` (it only contains public Google Maps info, nothing
   secret) and push. The scheduled workflow takes it from there.

## Fields (`config.json`)

| Field              | Required | Default | Notes                                                        |
|--------------------|----------|---------|---------------------------------------------------------------|
| `query`            | yes      | —       | Search text fed to the scraper, e.g. `"Business Name, City"`. |
| `cid`              | no       | —       | Google Maps CID for exact matching. See step 3-4 above.       |
| `writeReviewUrl`   | no       | —       | "Leave a review" deep link. Falls back to the listing link.   |
| `depth`            | no       | `1`     | Scraper's max scroll depth in search results.                 |
| `exitOnInactivity` | no       | `"3m"`  | How long the scraper waits before giving up.                  |

## Why a patched image

Upstream `gosom/google-maps-scraper` (both the default Playwright build and
the `-rod` variant) has a real bug: it clicks Google's "Read more" toggle on
long reviews, then reads the text in the same synchronous instant - before
Google's async expand-fetch resolves - so long reviews come back truncated
("…") every single run, deterministically (confirmed by scraping the same
business twice and getting byte-identical truncated output both times).
`patches/full-review-text.patch` fixes this by waiting (polling, up to two
~10s rounds - re-clicking between rounds - so ~20s worst case) for the
expansion to actually land before reading. The expand-fetch latency varies
run to run, so a short fixed wait isn't reliable; this was verified clean
across multiple consecutive real scrapes against a real business: 8/8
reviews came back full every time, vs. 4/8 truncated with the unpatched
image.

Separately, the default Playwright-based image is currently broken upstream
regardless: as of 2026-07 its driver download 404s against every version due
to an unrelated, active Microsoft CDN migration. `build-scraper-image.sh`
builds from source using the `-rod` (go-rod) backend to route around that
too. Both are upstream issues, not bugs in this setup - re-check periodically
whether either gets fixed, which would allow going back to a plain
`docker pull`. If Google ever changes the review-card markup
(`.wiI7pd` text span, `.w8nwRe` expand button), the patch may need updating
to match - `run-scraper.sh`'s comments explain what to look for.

Separately, a rare, unrelated upstream bug (a `sync.Once`/nil-map race in
`extractPlaceID`) can occasionally crash a single business's job with a
panic, so that business is simply missing from `results.ndjson` for that
run. If it's the configured business, `transform-reviews.mjs`'s strict `cid`
match throws instead of publishing incomplete/stale data, which fails that
CI run cleanly (the live `reviews.json` is left untouched). Re-running the
workflow has always resolved it in testing - it doesn't reproduce on the
same business twice in a row.
```

### 4.8 Remove conflicting legacy review-fetch code, if any

If the repo already has a build-time review fetcher (e.g. a `prebuild` npm
script calling SerpApi/Serper, or any other paid API), remove it **after**
step 5's verification passes, so there's exactly one source of truth for
`src/data/settings/reviews.json`:
- Delete the old fetch script and its directory if it becomes empty.
- Remove any `prebuild`/related entries from `package.json`'s `scripts`.
- Remove any now-unused API-key env vars from `.env.example`.
- Grep the repo (case-insensitive) for the old provider's name to confirm
  nothing references it anymore.

## 5. Business onboarding (fill in config.json)

Follow `.github/scripts/README.md`'s "Setting this up for a new client site"
section (step 4.7 above) — ask for the business name and city if not
already known, run once without `cid`, copy the correct `cid` from the
logged candidate list back into `config.json`.

## 6. Local verification (do this before considering it done)

```bash
bash .github/scripts/run-scraper.sh          # needs Docker running
node .github/scripts/transform-reviews.mjs
cat .github/scripts/output/reviews.staged.json   # sanity-check real data
cp .github/scripts/output/reviews.staged.json src/data/settings/reviews.json
bun run build   # or npm run build — confirm it still builds clean
bun run dev     # open in a browser, confirm real reviews render
```

Open the homepage specifically (`/`, not just any page) and confirm the
reviews section actually appears there — and specifically that it sits
immediately before the homepage's primary CTA section, matching the
reference implementation's slot (step 3.2, item 5), not just "somewhere on
the page." If you built a new UI section, also compare it side-by-side
against 2-3 neighboring sections to confirm it genuinely matches their
spacing, type scale, and color usage rather than merely resembling them.

Only revert the `src/data/settings/reviews.json` copy or commit everything
once the output looks right — don't push without visually checking it.

## 7. Gotchas already solved in the files above (don't rediscover these)

- **Default (Playwright) image is broken upstream right now.** Every driver
  version 404s from `playwright.azureedge.net` due to an active Microsoft
  CDN migration unrelated to this project. `build-scraper-image.sh` builds
  from source with the `-rod` (go-rod) backend specifically to route around
  it.
- **Long reviews come back truncated (`…`), deterministically, every run.**
  Upstream clicks Google's "Read more" toggle then reads the text in the
  same synchronous instant, before Google's async expand-fetch resolves.
  `patches/full-review-text.patch` splits click and read into separate
  steps with a real polling wait (up to two ~10s rounds, ~20s worst case)
  for the expansion to actually land. Verified 4/8 → 8/8 full reviews
  across multiple consecutive real scrapes.
- **CID-style Maps URLs are not valid scraper input.** They get treated as
  literal search text and produce a JS eval error. Use plain text queries.
- **Text search returns loosely related businesses**, not just the one you
  want — `transform-reviews.mjs` selects by exact `cid` match rather than
  trusting result order, with a title-match fallback for first-time setup.
- **The scraper's review fields use untagged Go struct names** (`Name`,
  `ProfilePicture`, `Rating`, `Description`, `Images`, `When`), not the
  documented json-tagged ones — `pick()` tries both.
- **No timestamp field is present** in this backend's review output —
  `isoDate` stays `""`. Harmless if the consuming component only uses it for
  sort tie-breaking.

## 8. Known limitations going forward

- **Rare, self-healing upstream panic.** A `sync.Once`/nil-map race in
  gosom's `extractPlaceID` can occasionally crash a single business's job,
  leaving it missing from that run's output. If it's the configured
  business, `transform-reviews.mjs`'s strict `cid` match throws instead of
  publishing bad data, so the CI run fails cleanly without touching the live
  `reviews.json`. Re-running has always resolved it in testing — it hasn't
  reproduced on the same business twice in a row. Out of scope to patch
  (unrelated to the truncation fix, and self-healing on retry).
- GitHub-hosted runner IPs are shared/datacenter IPs; Google Maps may
  occasionally rate-limit or CAPTCHA them. No proxy is configured — the
  scraper's `-proxies` flag is the documented escape hatch if needed.
- The workflow pushes straight to `main` on every successful run — no PR
  review gate. Change the "Publish + commit" step to open a PR instead if
  that's not acceptable for a given repo.
- If Google ever changes the review-card markup (`.wiI7pd` text span,
  `.w8nwRe` expand button), the patch may need updating to match — see
  `run-scraper.sh`'s comments for what to look for.
