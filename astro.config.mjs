// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";
import {
  getSitemapGeneratedDate,
  getSitemapLastmodLookup,
  patchSitemapFiles,
  serializeSitemapItem,
} from "./scripts/sitemap-lastmod-data.mjs";

const site = "https://sariswing.com";
const buildEnd = new Date();
const generatedAt = getSitemapGeneratedDate(buildEnd);
const lastmodLookup = await getSitemapLastmodLookup({ generatedAt, buildEnd });

function sitemapLastmodFormatIntegration() {
  return {
    name: "sitemap-lastmod-format",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        await patchSitemapFiles(fileURLToPath(dir), lastmodLookup);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site,
  build: {
    assets: "assets",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/admin") && !page.includes("__admin-preview"),
      serialize(item) {
        return serializeSitemapItem(item, lastmodLookup, generatedAt);
      },
    }),
    sitemapLastmodFormatIntegration(),
  ],
});
