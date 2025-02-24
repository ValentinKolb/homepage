// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import config from "./src/config/config.json";
import node from "@astrojs/node";
import solidJs from "@astrojs/solid-js";

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
  integrations: [sitemap(), mdx(), solidJs({ devtools: true })],
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
