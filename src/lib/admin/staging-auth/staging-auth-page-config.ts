/**
 * G-9j5a / G-9j5b-fix — Server-injected auth page config bridge (client reads data attrs).
 */

export const STAGING_AUTH_PAGE_CONFIG_ELEMENT_ID = "staging-auth-page-config";

export interface StagingAuthPageConfig {
  stagingAuthEnabled: boolean;
  adminAuthProvider: string;
  supabaseConfigured: boolean;
}

export function resolveStagingAuthPageServerFlags(
  env: ImportMetaEnv = import.meta.env,
): StagingAuthPageConfig {
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  return {
    stagingAuthEnabled:
      env.ENABLE_ADMIN_STAGING_AUTH === "true" ||
      env.PUBLIC_ENABLE_ADMIN_STAGING_AUTH === "true",
    adminAuthProvider: String(env.PUBLIC_ADMIN_AUTH_PROVIDER ?? "").trim(),
    supabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}

export function readStagingAuthPageConfigFromDom(): StagingAuthPageConfig | null {
  if (typeof document === "undefined") return null;

  const config = document.getElementById(STAGING_AUTH_PAGE_CONFIG_ELEMENT_ID);
  if (!config) return null;

  return {
    stagingAuthEnabled:
      config.getAttribute("data-staging-auth-enabled") === "true",
    adminAuthProvider: config.getAttribute("data-admin-auth-provider") ?? "",
    supabaseConfigured:
      config.getAttribute("data-supabase-configured") === "true",
  };
}

export function isStagingAuthInteractiveFromPageConfig(
  pageConfig: StagingAuthPageConfig,
): boolean {
  return (
    pageConfig.stagingAuthEnabled &&
    pageConfig.adminAuthProvider === "supabase" &&
    pageConfig.supabaseConfigured
  );
}

export function isStagingAuthInteractiveFromDom(): boolean {
  const pageConfig = readStagingAuthPageConfigFromDom();
  if (!pageConfig) return false;
  return isStagingAuthInteractiveFromPageConfig(pageConfig);
}
