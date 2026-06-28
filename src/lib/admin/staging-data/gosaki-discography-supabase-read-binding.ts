/**
 * G-15a — Gosaki staging Discography admin Supabase read binding (SSR, read-only).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "./staging-schedule-site-slug-host-gate";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import { loadDiscographyForAdminRead } from "../staging-write/staging-discography-read";
import {
  G15A_PHASE,
  GOSAKI_DISCOGRAPHY_EXPECTED_LEGACY_IDS,
  GOSAKI_DISCOGRAPHY_PREVIEW_PATH,
  GOSAKI_DISCOGRAPHY_SITE_SLUG,
  type GosakiDiscographyRecord,
  type GosakiDiscographyReadSource,
} from "./gosaki-discography-read-types";

export type { GosakiDiscographyRecord } from "./gosaki-discography-read-types";

export interface GosakiDiscographySupabaseReadBinding {
  phase: typeof G15A_PHASE;
  siteSlug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  previewPath: typeof GOSAKI_DISCOGRAPHY_PREVIEW_PATH;
  source: GosakiDiscographyReadSource;
  readOnly: true;
  selectOnly: true;
  supabaseReadEnabled: boolean;
  saveEnabled: false;
  dbWriteEnabled: false;
  rows: GosakiDiscographyRecord[];
  releaseCount: number;
  publishedCount: number;
  expectedLegacyIds: readonly string[];
  legacyIdsFound: string[];
  selectedLegacyId: string | null;
  message: string | null;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  expectedProject: string;
  expectedHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
}

export async function resolveGosakiDiscographySupabaseReadBinding(): Promise<GosakiDiscographySupabaseReadBinding> {
  const dataConfig = getReadOnlyDataConfig();
  const hostGate = evaluateSupabaseHostGate(dataConfig.supabaseUrl);
  const projectGate = evaluateStagingProjectAllowlist(dataConfig.supabaseUrl);

  const base = {
    phase: G15A_PHASE,
    siteSlug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
    previewPath: GOSAKI_DISCOGRAPHY_PREVIEW_PATH,
    readOnly: true as const,
    selectOnly: true as const,
    supabaseReadEnabled: false,
    saveEnabled: false as const,
    dbWriteEnabled: false as const,
    rows: [] as GosakiDiscographyRecord[],
    releaseCount: 0,
    publishedCount: 0,
    expectedLegacyIds: GOSAKI_DISCOGRAPHY_EXPECTED_LEGACY_IDS,
    legacyIdsFound: [] as string[],
    selectedLegacyId: null as string | null,
    message: null as string | null,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    supabaseHost: dataConfig.supabaseUrl
      ? extractSupabaseHost(dataConfig.supabaseUrl)
      : undefined,
    dataReadEnabled: dataConfig.supabaseDataEnabled,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectGate.allowlistPassed,
  };

  if (!dataConfig.stagingShellEnabled) {
    return {
      ...base,
      source: "unavailable",
      message: "Staging shell disabled — Discography Supabase read unavailable.",
    };
  }

  if (!dataConfig.dataReadFlag || dataConfig.provider !== "supabase") {
    return {
      ...base,
      source: "unavailable",
      message:
        "ENABLE_ADMIN_STAGING_DATA_READ=true and PUBLIC_ADMIN_DATA_PROVIDER=supabase required.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ...base,
      source: "unavailable",
      message: "PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY missing.",
    };
  }

  if (!hostGate.hostGatePassed) {
    return {
      ...base,
      source: "unavailable",
      message: hostGate.warningMessage ?? "Staging host gate failed.",
    };
  }

  if (!projectGate.allowlistPassed) {
    return {
      ...base,
      source: "unavailable",
      message: projectGate.errorMessage ?? "Staging project allowlist failed.",
    };
  }

  const result = await loadDiscographyForAdminRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    useSupabase: true,
  });

  const rows = result.records;
  const legacyIdsFound = rows.map((row) => row.legacy_id);
  const selectedLegacyId =
    rows.find((row) => row.legacy_id === "discography-002")?.legacy_id ??
    rows[0]?.legacy_id ??
    null;

  const supabaseReadEnabled = result.source === "supabase" && rows.length > 0;

  return {
    ...base,
    source: supabaseReadEnabled ? "supabase" : "unavailable",
    supabaseReadEnabled,
    rows,
    releaseCount: rows.length,
    publishedCount: rows.filter((row) => row.published !== false).length,
    legacyIdsFound,
    selectedLegacyId,
    message:
      result.error ??
      (supabaseReadEnabled
        ? "Discography Supabase read: enabled. Save: disabled. DB write: disabled."
        : "No discography rows returned from Supabase."),
  };
}
