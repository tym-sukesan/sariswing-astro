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

/**
 * CMS Kit admin preview/shell routes live under src/pages/__admin-* which Astro
 * excludes from file-based routing (leading underscore). injectRoute registers
 * the public URLs without moving co-located page files.
 */
function cmsKitAdminShellRoutesIntegration() {
  return {
    name: "cms-kit-admin-shell-routes",
    hooks: {
      "astro:config:setup": ({ injectRoute, command }) => {
        injectRoute({
          pattern: "/__admin-preview/musician-basic",
          entrypoint: new URL(
            "./src/pages/__admin-preview/musician-basic/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/admin",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/admin/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/admin/schedule",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/admin/schedule/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/admin/youtube",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/admin/youtube/index.astro",
            import.meta.url,
          ),
        });
        // G-10c Save API — dev only (prerender=false endpoint; static build has no adapter)
        if (command === "dev") {
          injectRoute({
            pattern:
              "/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json",
            entrypoint: new URL(
              "./src/pages/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json.ts",
              import.meta.url,
            ),
          });
        }
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/admin/discography",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/admin/discography/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/admin/about",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/admin/about/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/auth/forgot-password",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/auth/forgot-password/index.astro",
            import.meta.url,
          ),
        });
        injectRoute({
          pattern: "/__admin-staging-shell/musician-basic/auth/reset-password",
          entrypoint: new URL(
            "./src/pages/__admin-staging-shell/musician-basic/auth/reset-password/index.astro",
            import.meta.url,
          ),
        });
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
        !page.includes("/admin") &&
        !page.includes("__admin-preview") &&
        !page.includes("__admin-staging-shell"),
      serialize(item) {
        return serializeSitemapItem(item, lastmodLookup, generatedAt);
      },
    }),
    sitemapLastmodFormatIntegration(),
    cmsKitAdminShellRoutesIntegration(),
  ],
});
