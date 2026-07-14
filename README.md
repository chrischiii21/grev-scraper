# Astro Marketing Website Scaffolding

A production-ready Astro website scaffolding following AstroWind best practices, optimized for AI content management.

## 🚀 Feature

- ✅ **Content Collections** - Type-safe MDX content management
- ✅ **Dynamic Navigation** - Auto-generated from content
- ✅ **View Transitions** - Instant page navigation (SPA-like)
- ✅ **SEO Optimized** - Meta tags, Open Graph, Twitter Cards
- ✅ **Config-driven** - Single YAML file for site settings
- ✅ **Tailwind CSS** - Modern styling with Tailwind v4
- ✅ **TypeScript** - Full type safety
- ✅ **AI-friendly** - Easy content updates via config files

## 📁 Project Structure

```
/
├── src/
│   ├── config.yaml              # Site configuration
│   ├── navigation.ts            # Navigation structure
│   ├── content/                 # MDX content files
│   │   ├── solutions/
│   │   │   ├── foundational/
│   │   │   └── lead-gen/
│   │   └── indoor-billboards/
│   ├── components/
│   │   ├── ui/                  # UI components
│   │   └── widgets/             # Page sections (Hero, Features, etc.)
│   ├── layouts/                 # Page layouts
│   ├── pages/                   # Routes
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript types
├── vendor/
│   └── integration/             # Config loader integration
├── docs/
│   └── AI_GUIDELINES.md         # AI content management guide
└── public/                      # Static assets
```

## 🛠️ Getting Started

### Prerequisite

- [Bun](https://bun.sh) 1.1+

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

Visit `http://localhost:4321`

Create `.env.local` for local environment overrides:

```bash
PUBLIC_SITE_STATUS=staging
```

Switch that value to `live` whenever you want the real website to show instead of the staging page.

### Build

```bash
bun run build
```

### Preview

```bash
bun run preview
```

## 📝 Content Management

### Update Site Settings

Edit `src/config.yaml`:

```yaml
site:
  name: Your Brand
  site: 'https://yourdomain.com'
  trailingSlash: false

metadata:
  title:
    default: Your Brand
  description: 'Your site description'
```

### Add New Service Page

Create a new MDX file in `src/content/solutions/foundational/` or `lead-gen/`:

```mdx
---
title: "Service Name"
description: "Service description"
category: "foundational"
order: 1
---

# Service Name

Your content here...
```

The page automatically appears in navigation and at the correct URL.

### Update Navigation

Edit `src/navigation.ts` to customize menu structure. Sections marked `'auto'` are populated from content collections.

## 🤖 AI Content Management

See `docs/AI_GUIDELINES.md` for detailed instructions on how AI can update content.

**Quick Reference:**
- Site settings: `src/config.yaml`
- Navigation: `src/navigation.ts`
- Service pages: `src/content/solutions/`
- Billboard pages: `src/content/indoor-billboards/`
- Homepage: `src/pages/index.astro`

## 🎨 Customization

### Styling

Global styles: `src/styles/global.css`

Tailwind config is handled via `@tailwindcss/vite` plugin.

### Components

Reusable widgets in `src/components/widgets/`:
- `Hero.astro` - Hero sections
- `Features.astro` - Feature grids
- `CallToAction.astro` - CTA sections
- `Header.astro` - Site header
- `Footer.astro` - Site footer

### Layouts

- `BaseLayout.astro` - Base HTML structure
- `PageLayout.astro` - Standard page wrapper

## 📦 Tech Stack

- **Framework:** Astro 6.x
- **Styling:** Tailwind CSS 4.x
- **Content:** MDX with Content Collections
- **Type Safety:** TypeScript
- **Config:** YAML with Zod validation
- **View Transitions:** Astro's built-in ClientRouter

## 🔧 Utilities

- `permalinks.ts` - URL generation
- `utils.ts` - Date formatting, number formatting
- `images.ts` - Image path resolution
- `frontmatter.ts` - Reading time calculation
- `directories.ts` - Path utilities

## 📚 Documentation

- [AI Guidelines](docs/AI_GUIDELINES.md) - How to update content
- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)

## 🚀 Deployment

Build the site:

```bash
bun run build
```

### Staging / Launch Toggle

- `PUBLIC_SITE_STATUS=staging` keeps the whole site on the branded under-construction page.
- `PUBLIC_SITE_STATUS=live` reveals the full website.
- While staging is enabled, non-home routes immediately redirect visitors back to `/`.
- On Vercel, add `PUBLIC_SITE_STATUS` as an environment variable and redeploy after changing it.

Deploy the `dist/` folder to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 📄 License

MIT

## 🙏 Credits

Inspired by [AstroWind](https://github.com/arthelokyo/astrowind)
