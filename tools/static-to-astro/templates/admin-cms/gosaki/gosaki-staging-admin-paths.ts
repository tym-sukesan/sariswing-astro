/** Gosaki staging shell admin route paths (not production /admin/). */

import {
  STAGING_ADMIN_HOME_PATH,
  STAGING_FORGOT_PASSWORD_PATH,
  STAGING_RESET_PASSWORD_PATH,
  STAGING_SHELL_BASE,
} from "../../../../../src/lib/admin/staging-auth/staging-auth-paths";

export const GOSAKI_STAGING_SHELL_BASE = STAGING_SHELL_BASE;
export const GOSAKI_STAGING_ADMIN_BASE = STAGING_ADMIN_HOME_PATH;
export const GOSAKI_STAGING_AUTH_FORGOT_PASSWORD_PATH = STAGING_FORGOT_PASSWORD_PATH;
export const GOSAKI_STAGING_AUTH_RESET_PASSWORD_PATH = STAGING_RESET_PASSWORD_PATH;
export const GOSAKI_STAGING_ADMIN_SCHEDULE_PATH =
  "/__admin-staging-shell/musician-basic/admin/schedule/";
export const GOSAKI_STAGING_ADMIN_YOUTUBE_PATH =
  "/__admin-staging-shell/musician-basic/admin/youtube/";
export const GOSAKI_STAGING_ADMIN_DISCOGRAPHY_PATH =
  "/__admin-staging-shell/musician-basic/admin/discography/";
export const GOSAKI_STAGING_ADMIN_ABOUT_PATH =
  "/__admin-staging-shell/musician-basic/admin/about/";
export const GOSAKI_STAGING_PREVIEW_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
