import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projects — case studies
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(), // one-line description for the archive row
      tagline: z.string().optional(), // plain-language card subtitle (DS v0.3)
      year: z.number(),
      role: z.string().optional(), // e.g. "Product Design"
      company: z.string().optional(),
      cover: image().optional(), // real screenshot, not a logo mark
      tags: z.array(z.string()).default([]),
      external: z.string().url().optional(), // if it links out instead of a case study
      featured: z.boolean().default(false), // show in the homepage featured grid
      hero: z.boolean().default(false), // single homepage hero — exactly one should be true
      draft: z.boolean().default(false),
    }),
});

// Writing — essays, notes; older papers/fiction live as external links
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    date: z.coerce.date(),
    dateLabel: z.string().optional(), // display override when only the year is known ("2024")
    kind: z.string().optional(), // archive lane label; defaults to "writing"
    external: z.string().url().optional(), // links out (PDF, publication) instead of a local page
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Doodles — small visual entries with captions
const doodles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/doodles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      image: image(),
      alt: z.string(),
      caption: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

// Workshop — side projects, experiments, things in progress
const workshop = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/workshop' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      year: z.number(),
      status: z.enum(['live', 'in-dev', 'concept', 'archived']),
      stack: z.array(z.string()).default([]),
      hero: image().optional(),
      live: z.string().url().optional(),
      github: z.string().url().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, writing, doodles, workshop };
