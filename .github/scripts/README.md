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
   ```
   bash .github/scripts/run-scraper.sh
   node .github/scripts/transform-reviews.mjs
   ```
   The transform step logs every business it found for that search, e.g.:
   ```
   [transform-reviews] scraped candidates:
     - Acme Roofing (cid: 1234567890123456789, reviews: 42)
     - Acme Roofing & Gutters (cid: 9876543210987654321, reviews: 3)
   [transform-reviews] selected "Acme Roofing" (cid: 1234567890123456789).
   ```
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
across multiple consecutive real scrapes against this business: 8/8 reviews
came back full every time, vs. 4/8 truncated with the unpatched image.

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
panic, so that business is simply missing from `results.ndjson` for that run.
If it's the configured business, `transform-reviews.mjs`'s strict `cid`
match throws instead of publishing incomplete/stale data, which fails that
CI run cleanly (the live `reviews.json` is left untouched). Re-running the
workflow (`workflow_dispatch`, or waiting for the next scheduled run) has
always resolved it in testing - it doesn't reproduce on the same business
twice in a row.
