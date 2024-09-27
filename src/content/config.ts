import { defineCollection, z } from "astro:content";

const docs = defineCollection({
  type: "content",
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
});

const reportCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    // Add other frontmatter fields as needed
  }),
});

export const collections = { docs, reportCollection };
