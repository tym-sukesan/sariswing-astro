/**
 * Gosaki staging *package* admin route paths (G-20u39b4).
 * Uses Astro `BASE_URL` so links work under `/cms-kit-staging/gosaki-piano/admin/…`.
 * Export names match `templates/admin-cms/gosaki/gosaki-staging-admin-paths.ts`
 * so AdminGosakiStagingNav / OperatorHome can be reused without UI duplication.
 */

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveAdminBase(): string {
  const base = withTrailingSlash(String(import.meta.env.BASE_URL ?? "/"));
  return `${base}admin/`;
}

export const GOSAKI_STAGING_ADMIN_BASE = resolveAdminBase();
export const GOSAKI_STAGING_ADMIN_SCHEDULE_PATH = `${GOSAKI_STAGING_ADMIN_BASE}schedule/`;
export const GOSAKI_STAGING_ADMIN_DISCOGRAPHY_PATH = `${GOSAKI_STAGING_ADMIN_BASE}discography/`;
export const GOSAKI_STAGING_ADMIN_YOUTUBE_PATH = `${GOSAKI_STAGING_ADMIN_BASE}youtube/`;
export const GOSAKI_STAGING_ADMIN_ABOUT_PATH = `${GOSAKI_STAGING_ADMIN_BASE}about/`;

export const GOSAKI_STAGING_PREVIEW_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
