// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import config from "./src/config/config.json";
import node from "@astrojs/node";
import solidJs from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  output: "server", // use SSR for all routes as default
  adapter: node({
    mode: "standalone",
  }),
  redirects: {
    "/authors/valentin-kolb": "/about",
  },
  vite: {
    plugins: [tailwindcss()],
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
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Katex plugin options
        },
      ],
    ],
  },
});
