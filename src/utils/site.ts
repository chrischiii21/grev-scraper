// ===========================================
// SITE CONFIGURATION
// Reads from src/data/settings/site.json
// Edit settings via Pages CMS
// ===========================================

import siteData from '../data/settings/site.json';

const socialData = (siteData.social ?? {}) as Partial<
  Record<"facebook" | "instagram" | "linkedin" | "twitter" | "youtube", string>
>;

const cityName = siteData.location?.city || "Santa Fe Springs";
const stateName = siteData.location?.state || "CA";

// Resolve {city}/{state} placeholders in config strings (used raw in meta tags and schema)
const resolvePlace = (text: string) =>
  text.replaceAll("{city}", cityName).replaceAll("{state}", stateName);

export const siteConfig = {
  // Business Information
  business: {
    name: siteData.business?.name || "Vertical Flow",
    fullName: siteData.business?.fullName || "Vertical Flow",
    tagline: resolvePlace(siteData.business?.tagline || "Helping businesses grow through strategic digital marketing solutions that deliver real results."),
    description: resolvePlace(siteData.business?.description || "We are a local marketing company in Southern California. Premium marketing solutions including website design, social media management, and indoor billboard advertising."),
  },

  // Location
  location: {
    city: cityName,
    state: stateName,
    stateFull: (siteData.location as any)?.stateFull || "California",
    address: siteData.location?.address || "Santa Fe Springs, California",
    fullAddress: siteData.location?.fullAddress || "Santa Fe Springs, California",
  },

  // Contact
  contact: {
    email: siteData.contact?.email || "info@verticalflow.com",
    phone: siteData.contact?.phone || "3106069194",
    phoneFormatted: siteData.contact?.phoneFormatted || "(310) 606-9194",
  },

  // Brand Colors
  colors: {
    primary: siteData.colors?.primary || "#0175e2",
    secondary: siteData.colors?.secondary || "#0175e2",
    tertiary: (siteData.colors as any)?.tertiary || "#4fd1c5",
    quaternary: (siteData.colors as any)?.quaternary || "#F4B342",
    dark: siteData.colors?.dark || "#0D1445",
    light: siteData.colors?.light || "#f7fbfe",
  },

  // Logo
  logo: {
    src: siteData.logo?.src || "/images/vertical-flow-logo.svg",
    srcAvif: (siteData.logo as any)?.srcAvif || "",
    srcWebp: (siteData.logo as any)?.srcWebp || "",
    alt: siteData.logo?.alt || "Vertical Flow Logo",
  },

  // Social Media
  social: {
    facebook: socialData.facebook || "",
    instagram: socialData.instagram || "",
    linkedin: socialData.linkedin || "",
    twitter: socialData.twitter || "",
    youtube: socialData.youtube || "",
  },

  // Locations
  locations: (siteData.locations || []).map((loc: any) => ({
    name: loc.name,
    slug: loc.slug,
    enabled: loc.enabled !== false,
  })),

  // Map
  map: {
    embedUrl: siteData.map?.embedUrl || "",
    center: siteData.map?.center || "Santa Fe Springs, CA",
    latitude: siteData.map?.latitude || 33.9472,
    longitude: siteData.map?.longitude || -118.0519,
  },

  // SEO
  seo: {
    siteName: siteData.seo?.siteName || "Vertical Flow",
    defaultTitle: siteData.seo?.defaultTitle || "Vertical Flow",
    titleTemplate: siteData.seo?.titleTemplate || "%s — Vertical Flow",
    defaultDescription: siteData.seo?.defaultDescription || "We are a local marketing company in Southern California. Premium marketing solutions including website design, social media management, and indoor billboard advertising.",
    keywords: siteData.seo?.keywords || "",
    siteUrl: siteData.seo?.siteUrl || "https://verticalflow.com",
    ogImage: siteData.seo?.ogImage || "/images/vertical-flow-logo.svg",
    twitterHandle: siteData.seo?.twitterHandle || "",
  },

  // Analytics
  analytics: {
    googleAnalyticsId: siteData.analytics?.googleAnalyticsId || "",
    agencyGoogleAnalyticsId: siteData.analytics?.agencyGoogleAnalyticsId || "",
  },
}

// ============================================
// HELPER FUNCTIONS (backward-compatible)
// ============================================

export function getSiteName() {
  return siteConfig.business.name;
}

export function getSiteUrl() {
  return siteConfig.seo.siteUrl;
}

export function getPhone() {
  return siteConfig.contact.phoneFormatted;
}

export function getPhoneHref() {
  return `tel:${siteConfig.contact.phone}`;
}

export function getEmail() {
  return siteConfig.contact.email;
}

export function getEmailHref() {
  return `mailto:${siteConfig.contact.email}`;
}

export function getAddress() {
  return siteConfig.location.address;
}

export function getTagline() {
  return siteConfig.business.tagline;
}

export function getColors() {
  return siteConfig.colors;
}

export function getPrimaryColor() {
  return siteConfig.colors.primary;
}

export function getSecondaryColor() {
  return siteConfig.colors.secondary;
}

export function getTertiaryColor() {
  return siteConfig.colors.tertiary;
}

export function getQuaternaryColor() {
  return siteConfig.colors.quaternary;
}

export function getDarkColor() {
  return siteConfig.colors.dark;
}

export function getLightColor() {
  return siteConfig.colors.light;
}

export function getLocations() {
  return siteConfig.locations.filter((loc) => loc.enabled);
}

export function getSocial() {
  const icons: Record<string, string> = {
    linkedin: "tabler:brand-linkedin",
    facebook: "tabler:brand-facebook",
    instagram: "tabler:brand-instagram",
    youtube: "tabler:brand-youtube",
    twitter: "tabler:brand-twitter",
  };

  return Object.entries(siteConfig.social)
    .filter(([_, url]) => url !== "")
    .map(([key, url]) => ({
      url,
      ariaLabel: key.charAt(0).toUpperCase() + key.slice(1),
      icon: icons[key] || `tabler:brand-${key}`,
    }));
}

export function getMapDefaults() {
  return {
    embedUrl: siteConfig.map.embedUrl,
    center: siteConfig.map.center,
  };
}

// Helper to get location-aware text
export function getLocationText(text: string) {
  return text
    .replaceAll("{city}", siteConfig.location.city)
    .replaceAll("{stateFull}", siteConfig.location.stateFull)
    .replaceAll("{state}", siteConfig.location.state)
    .replaceAll("{business}", siteConfig.business.name)
    .replaceAll("{phoneFormatted}", siteConfig.contact.phoneFormatted)
    .replaceAll("{phone}", siteConfig.contact.phone)
    .replaceAll("{email}", siteConfig.contact.email);
}

// Recursively replace {city}, {state}, {business} in all string values
export function localizeData<T>(data: T): T {
  if (typeof data === "string") return getLocationText(data) as T;
  if (Array.isArray(data)) return data.map((item) => localizeData(item)) as T;
  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = localizeData(value);
    }
    return result as T;
  }
  return data;
}