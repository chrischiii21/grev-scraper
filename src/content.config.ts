import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Reusable metadata schema for SEO
const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),
      canonical: z.string().optional(),
      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const sharedStructuredDataSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    section: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    image: z.string().optional(),
    sections: z.array(z.object({}).passthrough()).optional(),
    metadata: metadataDefinition(),
  })
  .passthrough();

const pages = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sections: z
      .array(
        z.object({
          section: z.string(),
          eyebrow: z.string().optional(),
          tagline: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          description: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          image: z.string().optional(),
          image2: z.string().optional(),
          backgroundImage: z.string().optional(),
          background: z.string().optional(),
          imagePosition: z.string().optional(),
          layout: z.string().optional(),
          order: z.number().optional(),
          cards: z
            .array(
              z.object({
                title: z.string(),
                description: z.string(),
                icon: z.string().optional(),
                link: z.string().optional(),
                image: z.string().optional(),
                bgColor: z.string().optional(),
              })
            )
            .optional(),
          features: z
            .array(
              z.object({
                title: z.string(),
                description: z.string(),
                icon: z.string().optional(),
                image: z.string().optional(),
              })
            )
            .optional(),
          isCarousel: z.boolean().optional(),
          itemsPerSlide: z.number().optional(),
          carouselAutoplay: z.boolean().optional(),
          carouselAutoplayDelay: z.number().optional(),
          stats: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
              })
            )
            .optional(),
          keyPoints: z.array(z.string()).optional(),
          faqs: z
            .array(
              z.object({
                question: z.string(),
                answer: z.string(),
              })
            )
            .optional(),
          locations: z
            .array(
              z.union([
                z.string(),
                z.object({
                  name: z.string(),
                  url: z.string().optional(),
                }),
              ])
            )
            .optional(),
          mapUrl: z.string().optional(),
          viewMode: z.enum(["half", "full"]).optional(),
          formFields: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                label: z.string(),
                type: z.enum([
                  "text",
                  "email",
                  "tel",
                  "number",
                  "textarea",
                  "select",
                  "checkbox",
                  "radio",
                ]),
                placeholder: z.string().optional(),
                required: z.boolean().optional(),
                options: z.array(z.string()).optional(),
                rows: z.number().optional(),
                pattern: z.string().optional(),
                helpText: z.string().optional(),
                width: z.enum(["full", "half"]).optional(),
              })
            )
            .optional(),
          submitText: z.string().optional(),
          submitAction: z.string().optional(),
          contactInfo: z
            .array(
              z.object({
                icon: z.string(),
                label: z.string(),
                value: z.string(),
                link: z.string().optional(),
              })
            )
            .optional(),
          members: z
            .array(
              z.object({
                name: z.string(),
                role: z.string().optional(),
                location: z.string().optional(),
                image: z.string().optional(),
                bio: z.string().optional(),
                linkedin: z.string().optional(),
                email: z.string().optional(),
              })
            )
            .optional(),
          videoUrl: z.string().optional(),
          videoPosition: z.string().optional(),
          poster: z.string().optional(),
          autoplay: z.boolean().optional(),
          muted: z.boolean().optional(),
          loop: z.boolean().optional(),
          controls: z.boolean().optional(),
          centered: z.boolean().optional(),
          blueHeading: z.string().optional(),
          skills: z
            .array(
              z.object({
                title: z.string(),
                description: z.string().optional(),
                background: z.string().optional(),
                image: z.string().optional(),
              })
            )
            .optional(),
          networks: z
            .array(
              z.object({
                title: z.string(),
                brands: z.array(
                  z.object({
                    name: z.string(),
                    logo: z.string(),
                  })
                ),
              })
            )
            .optional(),
          steps: z
            .array(
              z.object({
                title: z.string(),
                description: z.string(),
                icon: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
    metadata: metadataDefinition(),
  }),
});

const solutions = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/solutions" }),
  schema: sharedStructuredDataSchema,
});

const indoorBillboards = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/indoor-billboards" }),
  schema: sharedStructuredDataSchema,
});

const settings = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/settings" }),
  schema: z.object({}).passthrough(),
});

export const collections = {
  pages,
  solutions,
  "indoor-billboards": indoorBillboards,
  settings,
};
