// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { getScheduleSitemapUrls } from "./scripts/schedule-sitemap-urls.mjs";

const site = "https://sariswing.com";
const scheduleMonthUrls = await getScheduleSitemapUrls(site);

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/admin"),
      customPages: scheduleMonthUrls,
    }),
  ],
});
