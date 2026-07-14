import type { NavigationLink } from "./types";
import { getPermalink } from "./utils/permalinks";
import { SITE_NAME, SITE_URL } from "./utils/config";
import { getSocial, getPhone, getPhoneHref, getEmail, getEmailHref, getAddress } from "./utils/site";

// Static navigation config - edit this file to update your navigation
export const headerData = {
  links: [
    {
      text: "Home",
      href: getPermalink("/"),
    },
    {
      text: "About Us",
      href: getPermalink("/about-us"),
      // Case Studies hidden until launch go-signal. To restore: uncomment this
      // block and rename src/pages/about-us/_case-studies back to case-studies.
      // links: [
      //   {
      //     text: "Case Studies",
      //     description: "Real results from real local businesses.",
      //     icon: "tabler:chart-arrows-vertical",
      //     href: getPermalink("/about-us/case-studies"),
      //   },
      // ],
    },
    {
      text: "Indoor Billboards",
      links: "auto", 
    },
    {
      text: "Solutions",
      href: getPermalink("/solutions"),
      links: [
        {
          text: "Foundational",
          links: "auto", 
        },
        {
          text: "Lead Gen",
          links: "auto", 
        },
        {
          text: "Branding & Awareness",
          links: "auto", 
        },
      ],
    },
  ] as any[],
  actions: [{ text: "Contact Us", href: getPermalink("/contact-us") }],
};

export const footerData = {
  links: [
    {
      title: "Company",
      links: [
        { text: "About", href: getPermalink("/about-us") },
        { text: "Contact", href: getPermalink("/contact-us") },
      ],
    },
    {
      title: "Solutions",
      links: [
        {
          text: "Foundational Services",
          href: getPermalink("/solutions/foundational"),
        },
        { text: "Lead Generation", href: getPermalink("/solutions/lead-gen") },
        { text: "Branding & Awareness", href: getPermalink("/solutions/branding-awareness") },
      ],
    },
    {
      title: "Indoor Billboards",
      links: [
        { text: "Screen Advertising", href: getPermalink("/indoor-billboards/screen-advertising") },
        { text: "Locations", href: getPermalink("/indoor-billboards/locations") },
        { text: "Become a Venue Partner", href: getPermalink("/indoor-billboards/become-a-venue-partner") },
      ],
    },
    {
      title: "Contact Us",
      links: [
        { text: getAddress(), href: "https://www.google.com/maps/place/San+Antonio,+TX", target: "_blank" },
        { text: getPhone(), href: getPhoneHref() },
        { text: getEmail(), href: getEmailHref() },
      ],
    },
  ],
  secondaryLinks: [
    { text: "Terms of Service", href: getPermalink("/terms-of-service") },
    { text: "Privacy Policy", href: getPermalink("/privacy-policy") },
  ],
  socialLinks: getSocial().map(social => ({
    ariaLabel: social.ariaLabel,
    icon: social.icon,
    href: social.url,
  })),
  footNote: `
    Made by <a class="text-primary-lighter underline hover:text-white transition" href="${SITE_URL}">${SITE_NAME}</a> · All rights reserved.
  `,
};
