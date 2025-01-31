// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import AutoImport from "astro-auto-import";
import { defineConfig } from "astro/config";
import config from "./src/config/config.json";
import node from "@astrojs/node";

export default defineConfig({
  experimental: {
    svg: true,
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  redirects: {
    "/authors/valentin-kolb": "/about",
  },
  vite: {
    // plugins: [tailwindcss()], todo v4
  },
  site: config.site.base_url,
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",
  image: {
    domains: ["s3.valentin-kolb.blog"],
    remotePatterns: [{ protocol: "https" }],
  },
  integrations: [
    react(),
    sitemap(),
    AutoImport({
      imports: [],
    }),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
