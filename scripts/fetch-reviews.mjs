// ===========================================
// FETCH GOOGLE REVIEWS
// Runs before `astro build` (npm prebuild hook).
// Writes src/data/settings/reviews.json.
// Fail-soft: any error keeps the existing JSON so builds never break.
//
// Providers (first key found wins):
//   SERPAPI_KEY    -> SerpApi (serpapi.com, google_maps_reviews engine)
//   SERPER_API_KEY -> Serper.dev (google.serper.dev/reviews)
// Keys live in the environment or in .env (gitignored).
// ===========================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_FILE = resolve(ROOT, "src/data/settings/reviews.json");

// Google Business listing for Alamo Media Network
const CID = "17250038746263541638";
const DATA_ID = "0x0:0xef6472d858c35786"; // hex form of CID, used by SerpApi
const QUERY = "Alamo Media Network San Antonio";
const REVIEWS_URL = `https://www.google.com/maps?cid=${CID}`;
const WRITE_REVIEW_URL = "https://g.page/r/CYZXw1jYcmTvEBM/review";

function loadEnv(name) {
  if (process.env[name]) return process.env[name];
  const envPath = resolve(ROOT, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*"?([^"#\\s]+)"?\\s*$`));
      if (m) return m[1];
    }
  }
  return null;
}

// ---------- SerpApi (serpapi.com) ----------
async function fetchViaSerpApi(key) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps_reviews");
  url.searchParams.set("data_id", DATA_ID);
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpApi responded ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`SerpApi: ${data.error}`);

  const reviews = (data.reviews || [])
    .filter((r) => r && (r.snippet || r.extracted_snippet?.original) && r.user?.name)
    .map((r) => ({
      author: r.user.name,
      avatar: r.user.thumbnail || "",
      rating: r.rating,
      date: r.date || "",
      isoDate: r.iso_date || "",
      text: r.snippet || r.extracted_snippet?.original || "",
      link: r.user.link || REVIEWS_URL,
    }));

  return {
    reviews,
    rating: data.place_info?.rating ?? null,
    totalReviews: data.place_info?.reviews ?? reviews.length,
  };
}

// ---------- Serper.dev ----------
async function serper(endpoint, body, key) {
  const res = await fetch(`https://google.serper.dev/${endpoint}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Serper ${endpoint} responded ${res.status}`);
  return res.json();
}

async function fetchViaSerper(key) {
  const reviewsData = await serper("reviews", { cid: CID }, key);
  const reviews = (reviewsData.reviews || [])
    .filter((r) => r && r.snippet && r.user?.name)
    .map((r) => ({
      author: r.user.name,
      avatar: r.user.thumbnail || "",
      rating: r.rating,
      date: r.date,
      isoDate: r.isoDate || "",
      text: r.snippet,
      link: r.link || REVIEWS_URL,
    }));

  let rating = null;
  let totalReviews = reviews.length;
  try {
    const places = await serper("places", { q: QUERY }, key);
    const match = (places.places || []).find((p) => p.cid === CID);
    if (match) {
      rating = match.rating ?? rating;
      totalReviews = match.ratingCount ?? totalReviews;
    }
  } catch (e) {
    console.warn(`[fetch-reviews] places lookup failed (${e.message}) - using review list for totals`);
  }

  return { reviews, rating, totalReviews };
}

async function main() {
  const serpApiKey = loadEnv("SERPAPI_KEY");
  const serperKey = loadEnv("SERPER_API_KEY");

  let result;
  if (serpApiKey) {
    console.log("[fetch-reviews] provider: SerpApi");
    result = await fetchViaSerpApi(serpApiKey);
  } else if (serperKey) {
    console.log("[fetch-reviews] provider: Serper.dev");
    result = await fetchViaSerper(serperKey);
  } else {
    console.warn("[fetch-reviews] no SERPAPI_KEY or SERPER_API_KEY set - keeping existing reviews.json");
    return;
  }

  const { reviews } = result;
  if (!reviews.length) throw new Error("provider returned no reviews");

  const rating =
    result.rating ??
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  const payload = {
    fetchedAt: new Date().toISOString(),
    rating,
    totalReviews: result.totalReviews,
    reviewsUrl: REVIEWS_URL,
    writeReviewUrl: WRITE_REVIEW_URL,
    reviews,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[fetch-reviews] wrote ${reviews.length} reviews (rating ${rating}, total ${payload.totalReviews})`);
}

main().catch((e) => {
  console.warn(`[fetch-reviews] failed (${e.message}) - keeping existing reviews.json`);
});
