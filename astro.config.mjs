// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import {
  getSitemapGeneratedDate,
  getSitemapLastmodLookup,
  pathnameFromSitemapUrl,
} from "./scripts/sitemap-lastmod-data.mjs";

const site = "https://sariswing.com";
const generatedAt = getSitemapGeneratedDate();
const lastmodLookup = await getSitemapLastmodLookup({ generatedAt });

// https://astro.build/config
export default defineConfig({
  site,
  build: {
    assets: "assets",
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/admin"),
      serialize(item) {
        const path = pathnameFromSitemapUrl(item.url);
        const lastmodDate = lastmodLookup.get(path) ?? generatedAt;

        return {
          ...item,
          lastmod: new Date(`${lastmodDate}T00:00:00.000Z`),
        };
      },
    }),
  ],
});
