// Thin case-studies data layer.
//
// All data comes from the shared, public, read-only Edge Function — a plain
// fetch() with NO credentials. The Supabase anon key lives server-side in the
// function, never in this template. See CASE-STUDIES-INTEGRATION.md.
//
//   GET <API>?client=<slug>
//   → { client: { id, slug, name, logo_url } | null, studies: CaseStudy[] }
//
// Only published rows are ever returned (enforced by RLS in the function).

/** One stat callout on the detail page, e.g. { value: "51.1%", label: "Increase in GBP Views" }. */
export interface Stat {
  value: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  client_id: string;

  slug: string;
  title: string;
  category: string | null;

  thumbnail_url: string | null;
  client_logo_url: string | null;
  hero_image_url: string | null;
  website_url: string | null;

  industry: string | null;
  challenge_summary: string | null;
  results_summary: string | null;

  stats: Stat[];

  about_business: string | null;
  challenge_body: string | null;
  solution_body: string | null;
  results_body: string | null;

  gallery: string[];

  published: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  client: { id: string; slug: string; name: string; logo_url: string | null } | null;
  studies?: CaseStudy[];
  error?: string;
}

// Client slug for this deploy (defaults to ntv360). Endpoint is overridable but
// defaults to the shared NTV360 function.
const CLIENT_SLUG = import.meta.env.PUBLIC_CLIENT_SLUG || "ntv360";
const API =
  import.meta.env.PUBLIC_CASE_STUDIES_API ||
  "https://swluvugjmdeawawvisql.functions.supabase.co/case-studies";

/** Fetch this client's published studies from the Edge Function (cached per build run). */
let _cache: Promise<CaseStudy[]> | null = null;
async function fetchStudies(): Promise<CaseStudy[]> {
  if (_cache) return _cache;
  _cache = (async () => {
    const res = await fetch(`${API}?client=${encodeURIComponent(CLIENT_SLUG)}`);
    if (!res.ok) throw new Error(`case-studies API ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as ApiResponse;
    if (body.error) throw new Error(`case-studies API: ${body.error}`);
    const studies = body.studies ?? [];
    // Normalize array fields defensively.
    return studies.map((cs) => ({
      ...cs,
      stats: Array.isArray(cs.stats) ? cs.stats : [],
      gallery: Array.isArray(cs.gallery) ? cs.gallery : [],
    }));
  })();
  return _cache;
}

/**
 * List published case studies for this deploy's client, sort_order first.
 * Optional category filter (omit or pass "All" for no filter).
 */
export async function listCaseStudies(
  options: { category?: string } = {},
): Promise<CaseStudy[]> {
  const studies = await fetchStudies();
  if (options.category && options.category !== "All") {
    return studies.filter((cs) => cs.category === options.category);
  }
  return studies;
}

/** Distinct, sorted, de-duped categories for the grid's filter pills. */
export async function getCategories(): Promise<string[]> {
  const studies = await fetchStudies();
  const set = new Set<string>();
  for (const cs of studies) {
    if (cs.category && cs.category.trim()) set.add(cs.category.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Get one published case study by its slug (null if not found). */
export async function getCaseStudy(caseStudySlug: string): Promise<CaseStudy | null> {
  const studies = await fetchStudies();
  return studies.find((cs) => cs.slug === caseStudySlug) ?? null;
}
