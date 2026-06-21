/**
 * G-9j5a — Staging shell auth routes (musician-basic). Not production /admin/.
 */

export const STAGING_SHELL_BASE = "/__admin-staging-shell/musician-basic/";
export const STAGING_ADMIN_HOME_PATH = "/__admin-staging-shell/musician-basic/admin/";
export const STAGING_FORGOT_PASSWORD_PATH =
  "/__admin-staging-shell/musician-basic/auth/forgot-password/";
export const STAGING_RESET_PASSWORD_PATH =
  "/__admin-staging-shell/musician-basic/auth/reset-password/";

/** Password reset email redirect (register in Supabase Dashboard Redirect URLs). */
export function getStagingResetPasswordRedirectUrl(): string {
  return `${window.location.origin}${STAGING_RESET_PASSWORD_PATH}`;
}
