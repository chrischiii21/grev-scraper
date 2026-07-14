// ===========================================
// NAVIGATION CONFIGURATION
// Reads from src/data/settings/navbar.json
//            src/data/settings/footer.json
// Edit settings via Pages CMS
// ===========================================

import navbarJson from '../data/settings/navbar.json';
import footerJson from '../data/settings/footer.json';
import { localizeData } from '../utils/site';

// --- Types ---

export interface NavItem {
  title: string
  description?: string
  href: string
  icon?: string
  thumbnail?: string
}

export interface NavLink {
  type: 'link'
  title: string
  href: string
}

export interface NavDropdown {
  type: 'dropdown'
  title: string
  items: NavItem[]
}

export interface NavMegaMenu {
  type: 'megamenu'
  title: string
  href?: string
  sections: {
    label: string
    items: NavItem[]
  }[]
  featured?: {
    title: string
    description: string
    href: string
    thumbnail?: string
  }[]
}

export type DynamicNavItem = NavLink | NavDropdown | NavMegaMenu

// --- Build navItems from JSON ---

function parseNavItems(raw: any[]): DynamicNavItem[] {
  return raw.map(item => {
    if (item.type === 'link') {
      return { type: 'link' as const, title: item.title, href: item.href }
    }
    if (item.type === 'dropdown') {
      return {
        type: 'dropdown' as const,
        title: item.title,
        items: (item.items || []) as NavItem[],
      }
    }
    if (item.type === 'megamenu') {
      return {
        type: 'megamenu' as const,
        title: item.title,
        href: item.href,
        sections: (item.sections || []).map((s: any) => ({
          label: s.label,
          items: s.items as NavItem[],
        })),
        featured: (item.featured || []).map((f: any) => ({
          title: f.title,
          description: f.description ?? '',
          href: f.href,
          thumbnail: f.thumbnail,
        })),
      }
    }
    return { type: 'link' as const, title: 'Unknown', href: '#' }
  })
}

export const navItems: DynamicNavItem[] = localizeData(parseNavItems(navbarJson.navItems ?? []))

// CTA Button
const defaultCtaButton = { text: "Contact Us", href: "/contact-us" }
const rawCtaButton = navbarJson.ctaButton ?? defaultCtaButton
export const ctaButton = {
  text: rawCtaButton.text ?? defaultCtaButton.text,
  href: rawCtaButton.href ?? defaultCtaButton.href,
}

// --- Footer config ---

export interface FooterLinksColumn {
  type: 'links'
  title: string
  links: { label: string; href: string }[]
}

export interface FooterAccordionColumn {
  type: 'accordion'
  title: string
  href?: string
  sections: {
    label: string
    items: { label: string; href: string }[]
  }[]
}

export interface FooterContactColumn {
  type: 'contact'
  title: string
}

export type FooterColumn = FooterLinksColumn | FooterAccordionColumn | FooterContactColumn

const defaultFooter = {
  description: "Your trusted partner for comprehensive digital marketing solutions.",
  columns: [] as FooterColumn[],
  bottomLinks: [
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
}

export const footerConfig = localizeData({
  description: footerJson.description ?? defaultFooter.description,
  columns: (footerJson.columns ?? defaultFooter.columns) as FooterColumn[],
  bottomLinks: footerJson.bottomLinks ?? defaultFooter.bottomLinks,
})
