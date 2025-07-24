// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import config from "./src/config/config.json";
import solidJs from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import bun from "@hedystia/astro-bun";
import wasm from "vite-plugin-wasm";

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/node_modules",
];

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*")].concat(PYODIDE_EXCLUDE),
        dest: "assets",
      },
    ],
  });
}

export default defineConfig({
  output: "server", // use SSR for all routes as default
  adapter: bun(),
  redirects: {
    "/authors/valentin-kolb": "/about",
  },
  vite: {
    optimizeDeps: {
      include: ["@codemirror/state", "@codemirror/view"],
      exclude: ["pyodide"],
    },
    plugins: [tailwindcss(), viteStaticCopyPyodide(), wasm()],
    assetsInclude: ["**/*.wasm", "**/*.md"],
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
