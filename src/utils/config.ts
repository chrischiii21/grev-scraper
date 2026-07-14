// ============================================
// GLOBAL SITE CONFIGURATION
// Reads from src/data/settings/site.json
// Edit settings via Pages CMS
// ============================================

import { siteConfig } from './site';

export const SITE_NAME = siteConfig.business.name;
export const SITE_URL = siteConfig.seo.siteUrl;
export const SITE_DESCRIPTION = siteConfig.seo.defaultDescription;

export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return siteConfig.seo.defaultTitle;
  return siteConfig.seo.titleTemplate.replace("%s", pageTitle);
}

export default siteConfig;