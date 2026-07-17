// ===========================================
// SCHEMA.ORG JSON-LD BUILDERS
// Generates structured data for SEO
// ===========================================

import { siteConfig } from "./site";

type Json = Record<string, unknown>;

function abs(origin: string, path: string): string {
  if (!path) return origin;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function socialUrls(): string[] {
  return Object.values(siteConfig.social).filter(
    (url) => typeof url === "string" && url && url !== "#"
  ) as string[];
}

export function organizationSchema(origin: string): Json {
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: siteConfig.business.name,
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: abs(origin, siteConfig.logo.src),
    },
    description: siteConfig.business.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phoneFormatted,
  };
  const sameAs = socialUrls();
  if (sameAs.length) schema.sameAs = sameAs;
  return schema;
}

export function localBusinessSchema(origin: string): Json {
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${origin}/#localbusiness`,
    name: siteConfig.business.name,
    image: abs(origin, siteConfig.logo.src),
    url: origin,
    telephone: siteConfig.contact.phoneFormatted,
    email: siteConfig.contact.email,
    description: siteConfig.business.description,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.map.latitude,
      longitude: siteConfig.map.longitude,
    },
    areaServed: [
      {
        "@type": "City",
        name: siteConfig.location.city,
      },
      { "@type": "State", name: siteConfig.location.stateFull },
      ...siteConfig.locations.map((loc) => ({
        "@type": "City",
        name: loc.name,
      })),
    ],
  };
  const sameAs = socialUrls();
  if (sameAs.length) schema.sameAs = sameAs;
  return schema;
}

export function websiteSchema(origin: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: siteConfig.seo.siteName,
    description: siteConfig.seo.defaultDescription,
    publisher: { "@id": `${origin}/#organization` },
    inLanguage: "en-US",
  };
}

export function breadcrumbSchema(
  origin: string,
  items: Array<{ name: string; path: string }>
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: abs(origin, item.path),
    })),
  };
}

export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>
): Json | null {
  const cleaned = (faqs || []).filter((f) => f && f.question && f.answer);
  if (!cleaned.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cleaned.map((f) => ({
      "@type": "Question",
      name: stripHtml(f.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(f.answer),
      },
    })),
  };
}

export function serviceSchema(
  origin: string,
  pageUrl: string,
  params: {
    name: string;
    description?: string;
    image?: string;
    serviceType?: string;
  }
): Json {
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    url: pageUrl,
    provider: { "@id": `${origin}/#organization` },
    areaServed: [
      {
        "@type": "City",
        name: siteConfig.location.city,
      },
      { "@type": "State", name: siteConfig.location.stateFull },
      ...siteConfig.locations.map((loc) => ({
        "@type": "City",
        name: loc.name,
      })),
    ],
  };
  if (params.description) schema.description = params.description;
  if (params.image) schema.image = abs(origin, params.image);
  if (params.serviceType) schema.serviceType = params.serviceType;
  return schema;
}

export function locationLocalBusinessSchema(
  origin: string,
  pageUrl: string,
  locationName: string
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${siteConfig.business.name} — ${locationName}`,
    image: abs(origin, siteConfig.logo.src),
    url: pageUrl,
    telephone: siteConfig.contact.phoneFormatted,
    email: siteConfig.contact.email,
    description: `${siteConfig.business.name} provides marketing services in ${locationName}.`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: locationName },
    parentOrganization: { "@id": `${origin}/#organization` },
  };
}

export function aboutPageSchema(origin: string, pageUrl: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: pageUrl,
    mainEntity: { "@id": `${origin}/#organization` },
  };
}

export function contactPageSchema(origin: string, pageUrl: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: pageUrl,
    mainEntity: { "@id": `${origin}/#organization` },
  };
}

function stripHtml(input: string): string {
  return String(input).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
