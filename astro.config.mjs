// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { readingTimeRemarkPlugin } from "./src/utils/frontmatter";
import configIntegration from "./vendor/integration/index";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const vercelUrl = process.env.VERCEL_URL;
const resolvedSite =
  (vercelProdUrl && `https://${vercelProdUrl}`) ||
  (vercelUrl && `https://${vercelUrl}`) ||
  "https://verticalflow.com";

// https://astro.build/config
export default defineConfig({
  site: resolvedSite,
  trailingSlash: 'never',
  integrations: [
    mdx(), 
    icon(), 
    sitemap({
      serialize(item) {
        return item;
      }
    }), 
    configIntegration()
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "~": "/src",
      },
    },
    build: {
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
  },
  build: {
    inlineStylesheets: 'always',
    assets: '_astro',
  },
  compressHTML: true,
  scopedStyleStrategy: 'where',
  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
  },
});
