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
