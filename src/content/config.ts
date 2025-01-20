import { ReciYMLSchema } from "@/components/ReciYML/types";
import { defineCollection, z } from "astro:content";

// Post collection schema
const blogsCollection = defineCollection({
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    date: z.date(),
    image: z.string().optional(),
    categories: z.array(z.string()).default(["others"]),
    tags: z.array(z.string()).default(["others"]),
    draft: z.boolean().optional().default(false),
    recipe: ReciYMLSchema.optional(),
  }),
});

// Pages collection schema
const pagesCollection = defineCollection({
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    layout: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// Gallery collection schema
const galleryCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    blogPost: z.string().optional(),
    images: z.array(
      z.object({
        src: z.string(),
        thumb: z.string().optional(),
        alt: z.string().optional(),
      }),
    ),
  }),
});

// Projects collection schema
const projectsCollection = defineCollection({
  schema: z.object({
    name: z.string(),
    desc: z.string(),
    logo: z.string().optional(),
    url: z.string().optional(),
    git_url: z.string().optional(),
  }),
});

// About collection schema
const aboutCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string(),
    image: z.string(), // Pfad zum Bild
    skills: z.object({
      programming_languages: z.object({
        title: z.string(),
        items: z.array(z.string()), // Liste von Programmiersprachen
      }),
      software_tools: z.object({
        title: z.string(),
        items: z.array(z.string()), // Liste von Tools
      }),
      interests: z.object({
        title: z.string(),
        items: z.array(z.string()), // Liste von Interessen
      }),
    }),
    jobs: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          role: z.string(), // Jobtitel
          company: z.string(), // Arbeitgeber
          description: z.string(), // Beschreibung der Tätigkeit
        }),
      ),
    }),
  }),
});

// Export collections
export const collections = {
  blogs: blogsCollection,
  pages: pagesCollection,
  gallery: galleryCollection,
  projects: projectsCollection,
  about: aboutCollection,
};
