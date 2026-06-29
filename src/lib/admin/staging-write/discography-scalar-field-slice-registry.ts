/**
 * G-17b — Gosaki Discography scalar field slice registry (staging shell).
 *
 * Closed chains from G-15b / G-15d / G-16a. New slices (G-17c+) add entries here.
 */

import {
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  type DiscographyWriteApprovalIdUnion,
} from "./discography-write-types";
import {
  G15A2_DRY_RUN_SLICE_APPROVAL_ID,
  G15A2_TARGET_LEGACY_ID,
  G15A2_TARGET_PURCHASE_URL_AFTER,
  G15A2_TARGET_PURCHASE_URL_BEFORE,
  G15A2_TARGET_TITLE,
  G15A2_TARGET_UPDATED_AT_BASELINE,
} from "./gosaki-discography-dry-run-types";
import {
  G15D_DRY_RUN_SLICE_APPROVAL_ID,
  G15D_TARGET_ARTIST_AFTER,
  G15D_TARGET_ARTIST_BEFORE,
  G15D_TARGET_ID,
  G15D_TARGET_LEGACY_ID,
  G15D_TARGET_TITLE,
  G15D_TARGET_UPDATED_AT_BASELINE,
} from "./gosaki-discography-next-field-types";
import {
  G16A_DRY_RUN_SLICE_APPROVAL_ID,
  G16A_TARGET_ARTIST_AFTER,
  G16A_TARGET_ARTIST_BEFORE,
  G16A_TARGET_ID,
  G16A_TARGET_LEGACY_ID,
  G16A_TARGET_TITLE,
  G16A_TARGET_UPDATED_AT_BASELINE,
} from "./gosaki-discography-g16a-next-field-types";

export const G15B_PHASE = "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";
export const G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED";
export const G15B_DISCOGRAPHY_SAVE_ENABLED_ENV = "G15B_DISCOGRAPHY_SAVE_ENABLED";

export const G15D_PHASE = "G-15d-gosaki-discography-existing-release-artist-non-dry-run";
export const G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED";
export const G15D_DISCOGRAPHY_SAVE_ENABLED_ENV = "G15D_DISCOGRAPHY_SAVE_ENABLED";

export const G16A_PHASE = "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
export const G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED";
export const G16A_DISCOGRAPHY_SAVE_ENABLED_ENV = "G16A_DISCOGRAPHY_SAVE_ENABLED";

export type DiscographyScalarFieldName =
  | "purchase_url"
  | "artist"
  | "title"
  | "year"
  | "release_date"
  | "catalog_number";

export type DiscographyScalarFieldSliceId =
  | "g15b-purchase-url"
  | "g15d-artist"
  | "g16a-artist";

export type DiscographyScalarFieldSliceEntry = {
  sliceId: DiscographyScalarFieldSliceId;
  phase: string;
  phaseLabel: string;
  legacyId: string;
  rowId: string;
  title: string;
  field: DiscographyScalarFieldName;
  approvalId: DiscographyWriteApprovalIdUnion;
  dryRunApprovalId: string;
  armedEnvName: string;
  enabledEnvName: string;
  expectedBeforeUpdatedAt: string;
  expectedBefore: string;
  expectedAfter: string;
  closed: true;
  forbiddenMarkers: readonly string[];
  publicPatchField: DiscographyScalarFieldName | null;
  defaultDisabledReason: string;
};

const G15B_TARGET_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";

export const DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY: readonly DiscographyScalarFieldSliceEntry[] =
  [
    {
      sliceId: "g15b-purchase-url",
      phase: G15B_PHASE,
      phaseLabel: "G-15b",
      legacyId: G15A2_TARGET_LEGACY_ID,
      rowId: G15B_TARGET_ID,
      title: G15A2_TARGET_TITLE,
      field: "purchase_url",
      approvalId: G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
      dryRunApprovalId: G15A2_DRY_RUN_SLICE_APPROVAL_ID,
      armedEnvName: G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV,
      enabledEnvName: G15B_DISCOGRAPHY_SAVE_ENABLED_ENV,
      expectedBeforeUpdatedAt: G15A2_TARGET_UPDATED_AT_BASELINE,
      expectedBefore: G15A2_TARGET_PURCHASE_URL_BEFORE,
      expectedAfter: G15A2_TARGET_PURCHASE_URL_AFTER,
      closed: true,
      forbiddenMarkers: ["[CMS Kit staging]", "PoC", "test", "G-15", "dry-run"],
      publicPatchField: "purchase_url",
      defaultDisabledReason:
        "Save disabled by default. Arm G-15b env stack for operator non-dry-run Save.",
    },
    {
      sliceId: "g15d-artist",
      phase: G15D_PHASE,
      phaseLabel: "G-15d",
      legacyId: G15D_TARGET_LEGACY_ID,
      rowId: G15D_TARGET_ID,
      title: G15D_TARGET_TITLE,
      field: "artist",
      approvalId: G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
      dryRunApprovalId: G15D_DRY_RUN_SLICE_APPROVAL_ID,
      armedEnvName: G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
      enabledEnvName: G15D_DISCOGRAPHY_SAVE_ENABLED_ENV,
      expectedBeforeUpdatedAt: G15D_TARGET_UPDATED_AT_BASELINE,
      expectedBefore: G15D_TARGET_ARTIST_BEFORE,
      expectedAfter: G15D_TARGET_ARTIST_AFTER,
      closed: true,
      forbiddenMarkers: ["[CMS Kit staging]", "PoC", "test", "G-15", "dry-run"],
      publicPatchField: "artist",
      defaultDisabledReason:
        "Save disabled by default. Arm G-15d env stack for operator non-dry-run Save.",
    },
    {
      sliceId: "g16a-artist",
      phase: G16A_PHASE,
      phaseLabel: "G-16a",
      legacyId: G16A_TARGET_LEGACY_ID,
      rowId: G16A_TARGET_ID,
      title: G16A_TARGET_TITLE,
      field: "artist",
      approvalId: G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
      dryRunApprovalId: G16A_DRY_RUN_SLICE_APPROVAL_ID,
      armedEnvName: G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
      enabledEnvName: G16A_DISCOGRAPHY_SAVE_ENABLED_ENV,
      expectedBeforeUpdatedAt: G16A_TARGET_UPDATED_AT_BASELINE,
      expectedBefore: G16A_TARGET_ARTIST_BEFORE,
      expectedAfter: G16A_TARGET_ARTIST_AFTER,
      closed: true,
      forbiddenMarkers: ["[CMS Kit staging]", "PoC", "test", "G-16", "dry-run"],
      publicPatchField: "artist",
      defaultDisabledReason:
        "Save disabled by default. Arm G-16a env stack for operator non-dry-run Save.",
    },
  ];

export function getDiscographyScalarSliceRegistryEntry(
  sliceId: DiscographyScalarFieldSliceId,
): DiscographyScalarFieldSliceEntry {
  const entry = DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY.find((item) => item.sliceId === sliceId);
  if (!entry) {
    throw new Error(`Unknown discography scalar field slice: ${sliceId}`);
  }
  return entry;
}

export function getDiscographyScalarSliceEntryByApprovalId(
  approvalId: string,
): DiscographyScalarFieldSliceEntry | null {
  return (
    DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY.find((item) => item.approvalId === approvalId) ?? null
  );
}

export function getDiscographyScalarSliceEntryByLegacyId(
  legacyId: string,
): DiscographyScalarFieldSliceEntry | null {
  return (
    DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY.find((item) => item.legacyId === legacyId) ?? null
  );
}

export function isDiscographyScalarSliceEnvArmTrue(
  env: ImportMetaEnv,
  envArm: string,
): boolean {
  return String(env[envArm] ?? "").trim() === "true";
}

export function getArmedDiscographyScalarSliceIds(
  env: ImportMetaEnv = import.meta.env,
): DiscographyScalarFieldSliceId[] {
  return DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY.filter((entry) =>
    isDiscographyScalarSliceEnvArmTrue(env, entry.armedEnvName),
  ).map((entry) => entry.sliceId);
}

export function collectOtherDiscographyScalarSliceEnvArmFailures(
  env: ImportMetaEnv,
  exceptSliceId?: DiscographyScalarFieldSliceId,
): string[] {
  const failures: string[] = [];
  for (const entry of DISCOGRAPHY_SCALAR_FIELD_SLICE_REGISTRY) {
    if (exceptSliceId && entry.sliceId === exceptSliceId) continue;
    if (isDiscographyScalarSliceEnvArmTrue(env, entry.armedEnvName)) {
      failures.push(`${entry.armedEnvName} must be off`);
    }
  }
  return failures;
}

export function detectMultipleDiscographyScalarSliceEnvArms(
  env: ImportMetaEnv = import.meta.env,
): string | null {
  const armed = getArmedDiscographyScalarSliceIds(env);
  if (armed.length > 1) {
    return `Multiple discography scalar slice arms on: ${armed.join(", ")}`;
  }
  return null;
}
