import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Coleção de artigos e análises comparativas de produtos para afiliados.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Pet Care Editorial Team'),
    category: z.string(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    rating: z.number().min(0).max(5).optional(),
    tags: z.array(z.string()).default([]),
    topPickName: z.string().optional(),
    topPickAsin: z.string().optional(),
    showPrimeBounty: z.boolean().default(true),
  }),
});

export const collections = { articles };
