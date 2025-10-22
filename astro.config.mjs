// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";
import config from "./src/config/config";
import solidJs from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import bun from "@hedystia/astro-bun";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  env: {
    schema: {
      APP_SECRET: envField.string({ context: "server", access: "secret" }),
    },
  },

  output: "server", // use SSR for all routes as default
  adapter: bun(),
  prefetch: true,
  redirects: {
    "/authors/valentin-kolb": "/about",
  },
  vite: {
    optimizeDeps: {
      include: ["@codemirror/state", "@codemirror/view", "mermaid"],
      exclude: ["@electric-sql/pglite"],
    },
    plugins: [tailwindcss(), wasm()],
    assetsInclude: ["**/*.wasm", "**/*.md"],
    worker: {
      format: "es",
    },
  },
  site: config.BASE_URL,
  base: "/",
  trailingSlash: "never",
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
