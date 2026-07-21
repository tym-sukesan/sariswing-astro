/**
 * Gosaki staging read-only admin — build-time view model (G-11b).
 * No runtime writes; no Supabase; no secrets.
 */

import type { GosakiYoutubeEmbedConfig } from "./gosaki-youtube-embed";
import { parseYoutubeVideoId, resolvePublishedGosakiYoutubeItems } from "./gosaki-youtube-embed";

export const GOSAKI_READ_ONLY_ADMIN_MARKER = "gosaki-read-only-admin";
export const GOSAKI_STAGING_SITE_SLUG = "gosaki-piano";
export const GOSAKI_STAGING_PREVIEW_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";

/** G-11c4a — staging-only dry-run endpoint wiring (public URLs; no secrets). */
export const G11C4A_PHASE = "G-11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep";
/** G-11c4b — staging public env wiring for Supabase Auth in static admin package. */
export const G11C4B_PHASE = "G-11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep";
/** G-11c4b-fix — auth configured login button + status message fix. */
export const G11C4B_FIX_PHASE = "G-11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable";
/** G-11c6a — YouTube URL save path local implementation (Save UI disabled). */
export const G11C6A_PHASE = "G-11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation-local-only";
export const G11C4A_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C4A_STAGING_SUPABASE_URL = `https://${G11C4A_STAGING_PROJECT_REF}.supabase.co`;
export const G11C4A_STAGING_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-dry-run`;
export const G11C6A_STAGING_SAVE_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-save`;
/** G-11c1 dry-run approval / operation (exact — do not alias). */
export const G11C1_OPERATION_ID = "G-11c1-gosaki-youtube-url-web-save-dry-run-poc";
export const G11C1_APPROVAL_ID = "G-11c1-youtube-url-dry-run";
export const G11C1_MODULE = "youtube-embed";
export const G11C1_FIELD = "embedCode";

export const G11C6_OPERATION_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_APPROVAL_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_SAVE_ENABLED_DEFAULT = false as const;
export const G11C6_SAVE_UI_ARMED_ENV = "PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED";
export const G11C6_SAVE_DISABLED_REASON =
  "保存は現在無効です";
export const G11C6_CONFLICT_MESSAGE =
  "他の場所で更新された可能性があります。再読み込みしてください。";

/** G-11c7 — ordered items[] dry-run / Save (same Edge functions · dual contract). */
export const G11C7_ITEMS_FIELD = "items";
export const G11C7_ITEMS_DRY_RUN_OPERATION_ID = "G-11c7-gosaki-youtube-items-dry-run";
export const G11C7_ITEMS_DRY_RUN_APPROVAL_ID = "G-11c7-gosaki-youtube-items-dry-run";
export const G11C7_ITEMS_SAVE_OPERATION_ID =
  "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice";
export const G11C7_ITEMS_SAVE_APPROVAL_ID =
  "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice";
export const G11C7_ITEMS_SAVE_DISABLED_REASON =
  "複数動画 Save は無効です。通常 STG package では常に無効。server arm · client arm · dry-run fingerprint · SHA lock が必要です。";

/** G-20u28 — staging read-only admin dashboard foundation polish. */
export const G20U28_ADMIN_UI_PHASE = "G-20u28-gosaki-admin-ui-foundation-polish";

/** G-20u29 — Discography editor prototype (read-only / Save disabled). */
export const G20U29_DISCOGRAPHY_EDITOR_PHASE = "G-20u29-gosaki-discography-edit-ui-prototype";
export const G20U29_DISCOGRAPHY_EDITOR_SAVE_DISABLED_REASON =
  "G-20u29: Discography Editor はプロトタイプです。Save は無効 — dry-run 検証と Save 設計は別フェーズです。";

/** G-20u30 — Discography track list dry-run validation (browser-only · no network write). */
export const G20U30_DISCOGRAPHY_DRY_RUN_PHASE = "G-20u30-gosaki-discography-dry-run-validation";
export const G20U30_DISCOGRAPHY_DRY_RUN_NOTE =
  "G-20u30: ローカル Dry-run validation — ブラウザ内差分表示。Save / DB write なし。Endpoint dry-run POST は G-20u36c。";

/** G-20u36c — Discography dry-run fetch POST wiring (staging Edge Function · Save disabled). */
export const G20U36C_DISCOGRAPHY_DRY_RUN_FETCH_POST_PHASE =
  "G-20u36c-admin-discography-dry-run-fetch-post-wiring";
export const G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-discography-save-dry-run`;
export const G20U36C_DISCOGRAPHY_DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
export const G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION = "dryRun" as const;
export const G20U36C_DISCOGRAPHY_DRY_RUN_NOTE =
  "G-20u36c: Dry-run only — POST to staging Edge Function. No DB write. Save is still disabled. This checks the request and endpoint response only.";
export const G20U36C_PRODUCTION_PROJECT_REF_STOP = "vsbvndwuajjhnzpohghh";

/** G-20u45 — Schedule HTTP dry-run + Save Edge (same URL · operation differs). */
export const G20U45_SCHEDULE_DRY_RUN_ENDPOINT_NAME = "gosaki-schedule-save-dry-run";
export const G20U45_SCHEDULE_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/${G20U45_SCHEDULE_DRY_RUN_ENDPOINT_NAME}`;
export const G20U45_SCHEDULE_DRY_RUN_ENDPOINT_ENV = "PUBLIC_GOSAKI_SCHEDULE_DRY_RUN_ENDPOINT";
export const G20U45_SCHEDULE_DRY_RUN_OPERATION = "dryRun" as const;
export const G20U45_SCHEDULE_SAVE_OPERATION = "save" as const;
/** Capability-stable Save approval (edit+create). Not a G-9k / G-22e phase alias. */
export const G20U45_SCHEDULE_SAVE_APPROVAL_ID = "gosaki-schedule-operational-save";
/** Discography-style local arm (exact "true" only · STG package default false). */
export const G20U45_SCHEDULE_SAVE_UI_ARMED_ENV = "PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED";
export const G20U45_SCHEDULE_SAVE_ENDPOINT = G20U45_SCHEDULE_DRY_RUN_ENDPOINT;
export const G20U45_SCHEDULE_CONFLICT_MESSAGE =
  "他の場所で更新された可能性があります。再読み込みしてください。";
export const G20U45_SCHEDULE_EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
] as const;

/** G-20u41 — Discography operational Save gated wiring (same Edge endpoint · default disabled). */
export const G20U41_DISCOGRAPHY_OPERATIONAL_SAVE_PHASE =
  "G-20u41-gosaki-discography-operational-save-ui-gated-local-wiring";
export const G20U41_DISCOGRAPHY_SAVE_OPERATION = "save" as const;
/** Historical tracklist Save approval (G-20u36e Edge allowlist) — not used by G-20u43 UI Save. */
export const G20U36_DISCOGRAPHY_TRACKLIST_SAVE_APPROVAL_ID =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
/** G-20u43 — label controlled Save slice (formal UI + Edge allowlist approval). */
export const G20U43_DISCOGRAPHY_LABEL_SAVE_APPROVAL_ID =
  "G-20u43-gosaki-discography-label-controlled-save-slice";
export const G20U43_DISCOGRAPHY_LABEL_LEGACY_ID = "discography-004";
export const G20U43_DISCOGRAPHY_LABEL_ALBUM_TITLE = "Ja-Jaaaaan!";
export const G20U43_DISCOGRAPHY_LABEL_ORIGINAL = "Mardi Gras JAPAN Records";
export const G20U43_DISCOGRAPHY_LABEL_TEMPORARY = "[CMS Kit staging] G-20u42 label PoC";
/** Operational UI Save approval — form editable fields (Edge OPERATIONAL_SAVE_APPROVAL_ID). */
export const G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID = "gosaki-discography-operational-save";
/** Formal Save uses the same staging Edge Function URL as dry-run (`operation` differs). */
export const G20U41_DISCOGRAPHY_SAVE_ENDPOINT = G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT;
export const G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV = "PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED";
export const G20U41_DISCOGRAPHY_SAVE_DEFAULT_DISABLED_REASON =
  "Save は無効です。dry-run 成功・ログイン・env arm・approval が揃うまで実行できません。";
export const G20U41_DISCOGRAPHY_CONFLICT_MESSAGE =
  "他の場所で更新された可能性があります。再読み込みしてください。";
export const G20U43_DISCOGRAPHY_LABEL_SAVE_HINT =
  "Discography Save はフォーム編集可能項目（title / artist / release_date / label / purchase_url / description / tracks）のみ。画像・catalog・published・streaming は対象外。";

/** G-20u36e — DB admin probe UI tools draft (read-only `rpc('is_admin')` · Save decoupled). */
export const G20U36E_ADMIN_PROBE_UI_TOOLS_DRAFT_PHASE =
  "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft";
export const G20U36E_ADMIN_PROBE_RPC_NAME = "is_admin" as const;
export const G20U36E_ADMIN_PROBE_BUTTON_LABEL = "DB admin probe (read-only)";
export const G20U36E_ADMIN_PROBE_NOTE =
  "Diagnostic only · DB is_admin() via admin_users (role=admin) · not mock allowlist · First controlled Save remains disabled · JWT / access_token / user_id / email not shown in probe result";

export type G20u36eAdminProbeStatus = "not_run" | "running" | "pass" | "fail" | "error";

export type G20u36eAdminProbeReasonCode =
  | "not_run"
  | "session_missing"
  | "rpc_success_true"
  | "rpc_success_false"
  | "rpc_error"
  | "production_ref_blocked"
  | "unexpected";

/**
 * Safe probe display only — never include tokens, user_id, email, or raw RPC messages.
 * saveEnabled is always false (probe must not arm Save).
 */
export interface G20u36eAdminProbeDisplay {
  adminProbeStatus: G20u36eAdminProbeStatus;
  isAdmin: boolean | null;
  reasonCode: G20u36eAdminProbeReasonCode;
  saveEnabled: false;
  diagnosticOnly: true;
}

export function createG20u36eAdminProbeIdleDisplay(): G20u36eAdminProbeDisplay {
  return {
    adminProbeStatus: "not_run",
    isAdmin: null,
    reasonCode: "not_run",
    saveEnabled: false,
    diagnosticOnly: true,
  };
}

export function createG20u36eAdminProbeRunningDisplay(): G20u36eAdminProbeDisplay {
  return {
    adminProbeStatus: "running",
    isAdmin: null,
    reasonCode: "not_run",
    saveEnabled: false,
    diagnosticOnly: true,
  };
}

/** Staging host only — production STOP · non-staging blocked as production_ref_blocked. */
export function assertG20u36eAdminProbeSupabaseHostSafe(supabaseUrl: string): boolean {
  const trimmed = String(supabaseUrl ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  return trimmed.includes(G11C4A_STAGING_PROJECT_REF);
}

export function resolveG20u36eAdminProbeHostBlockReason(
  supabaseUrl: string,
): "production_ref_blocked" | null {
  return assertG20u36eAdminProbeSupabaseHostSafe(supabaseUrl) ? null : "production_ref_blocked";
}

/**
 * Map session presence + is_admin RPC outcome to display.
 * Pass `sessionPresent` only — never pass access_token / user / email.
 * Pass `rpcFailed` as boolean — never pass raw error.message into UI.
 */
export function buildG20u36eAdminProbeDisplay(input: {
  supabaseUrl: string;
  sessionPresent: boolean;
  rpcData?: unknown;
  rpcFailed?: boolean;
}): G20u36eAdminProbeDisplay {
  const base = {
    saveEnabled: false as const,
    diagnosticOnly: true as const,
  };

  if (resolveG20u36eAdminProbeHostBlockReason(input.supabaseUrl)) {
    return {
      ...base,
      adminProbeStatus: "error",
      isAdmin: null,
      reasonCode: "production_ref_blocked",
    };
  }

  if (!input.sessionPresent) {
    return {
      ...base,
      adminProbeStatus: "fail",
      isAdmin: null,
      reasonCode: "session_missing",
    };
  }

  if (input.rpcFailed) {
    return {
      ...base,
      adminProbeStatus: "error",
      isAdmin: null,
      reasonCode: "rpc_error",
    };
  }

  if (input.rpcData === true) {
    return {
      ...base,
      adminProbeStatus: "pass",
      isAdmin: true,
      reasonCode: "rpc_success_true",
    };
  }

  if (input.rpcData === false) {
    return {
      ...base,
      adminProbeStatus: "fail",
      isAdmin: false,
      reasonCode: "rpc_success_false",
    };
  }

  return {
    ...base,
    adminProbeStatus: "error",
    isAdmin: null,
    reasonCode: "unexpected",
  };
}

/** Serialize only safe fields for UI / copy-paste (no secrets). */
export function formatG20u36eAdminProbeDisplay(display: G20u36eAdminProbeDisplay): string {
  return JSON.stringify(
    {
      adminProbeStatus: display.adminProbeStatus,
      isAdmin: display.isAdmin,
      reasonCode: display.reasonCode,
      saveEnabled: display.saveEnabled,
      diagnosticOnly: display.diagnosticOnly,
    },
    null,
    2,
  );
}

export interface DiscographyDryRunEndpointReleaseInput {
  title: string;
  artist?: string | null;
  release_date?: string | null;
  label?: string | null;
  catalog_number?: string | null;
  published?: boolean;
  cover_image_url?: string | null;
  purchase_url?: string | null;
  streaming_url?: string | null;
  description?: string | null;
}

export interface DiscographyDryRunEndpointRequestInput {
  legacyId: string;
  tracksText: string;
  release: DiscographyDryRunEndpointReleaseInput;
  /** Optimistic lock baseline — preserved for Edge dry-run (no Save). */
  expectedBeforeUpdatedAt?: string | null;
  /**
   * Optional browser diff stats for Edge cross-check.
   * Local `wouldWrite` is UI-only — never forwarded to `clientDryRun.wouldWrite`.
   */
  localDryRun?: Pick<
    DiscographyTrackListDryRunResult,
    "totalBefore" | "totalAfter" | "added" | "removed" | "reordered"
  >;
}

export interface DiscographyDryRunClientSnapshot {
  totalBefore: number;
  totalAfter: number;
  added: string[];
  removed: string[];
  reordered: boolean;
  /** Always false — browser never writes (Edge contract). */
  wouldWrite: false;
}

export interface DiscographyDryRunEndpointDisplay {
  httpStatus?: number;
  ok?: boolean;
  operation?: string;
  wouldWrite?: boolean;
  changedCounts?: Record<string, unknown>;
  diffSummary?: {
    tracksAdded?: number;
    tracksRemoved?: number;
    tracksReordered?: boolean;
    releaseFields?: string[];
    added?: string[];
    removed?: string[];
  };
  errors?: string[];
  warnings?: string[];
  didWrite: false;
  dbWrite: false;
  networkWrite: false;
  saveEnabled: false;
  authIssue?: boolean;
  authCategory?: string;
  sensitiveResponseBlocked?: boolean;
  fetchError?: string;
}

const DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
];

export function resolveG20u36cDiscographyDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT;
}

export function resolveGosakiScheduleDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env[G20U45_SCHEDULE_DRY_RUN_ENDPOINT_ENV as keyof ImportMetaEnv] ?? "").trim();
  if (fromEnv) return fromEnv;
  return G20U45_SCHEDULE_DRY_RUN_ENDPOINT;
}

export function assertGosakiScheduleDryRunEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  return trimmed.includes(G11C4A_STAGING_PROJECT_REF);
}

export type ScheduleDryRunEndpointRequestInput = {
  mode: "edit" | "create";
  id?: string | null;
  legacyId?: string | null;
  expectedBeforeUpdatedAt?: string | null;
  fields: {
    date?: string;
    open_time?: string;
    start_time?: string;
    title?: string;
    venue?: string;
    price?: string;
    description?: string;
    published?: boolean;
  };
};

function buildScheduleEndpointPayload(input: ScheduleDryRunEndpointRequestInput): Record<string, unknown> {
  if (input.mode === "edit") {
    const payload: Record<string, unknown> = {
      expectedBeforeUpdatedAt: String(input.expectedBeforeUpdatedAt ?? "").trim(),
    };
    const id = String(input.id ?? "").trim();
    const legacyId = String(input.legacyId ?? "").trim();
    if (id) payload.id = id;
    if (legacyId) payload.legacyId = legacyId;
    for (const field of G20U45_SCHEDULE_EDIT_SAFE_FIELDS) {
      if (field === "published") {
        payload.published = input.fields.published === true;
      } else {
        payload[field] = String(input.fields[field as keyof typeof input.fields] ?? "").trim();
      }
    }
    return payload;
  }
  return {
    date: String(input.fields.date ?? "").trim(),
    title: String(input.fields.title ?? "").trim(),
    venue: String(input.fields.venue ?? "").trim(),
    open_time: String(input.fields.open_time ?? "").trim(),
    start_time: String(input.fields.start_time ?? "").trim(),
    price: String(input.fields.price ?? "").trim(),
    description: String(input.fields.description ?? "").trim(),
    published: false,
  };
}

/**
 * Build Schedule Edge dry-run POST body — operation=dryRun only · never save.
 * Edit: safe fields + published boolean · no date. Create: published=false.
 */
export function buildScheduleDryRunEndpointRequest(
  input: ScheduleDryRunEndpointRequestInput,
): Record<string, unknown> {
  return {
    operation: G20U45_SCHEDULE_DRY_RUN_OPERATION,
    mode: input.mode,
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    payload: buildScheduleEndpointPayload(input),
  };
}

/**
 * Build Schedule Edge Save POST body — operation=save · exact approval ID.
 * Payload shape matches dry-run (edit + published · create published=false · no edit date).
 */
export function buildScheduleSaveEndpointRequest(
  input: ScheduleDryRunEndpointRequestInput,
): Record<string, unknown> {
  return {
    operation: G20U45_SCHEDULE_SAVE_OPERATION,
    approvalId: G20U45_SCHEDULE_SAVE_APPROVAL_ID,
    mode: input.mode,
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    payload: buildScheduleEndpointPayload(input),
  };
}

export function isG20u45ScheduleOperationalSaveArmed(env: ImportMetaEnv): boolean {
  return String(env[G20U45_SCHEDULE_SAVE_UI_ARMED_ENV as keyof ImportMetaEnv] ?? "").trim() === "true";
}

export function assertGosakiScheduleSaveEndpointSafe(endpoint: string): boolean {
  return assertGosakiScheduleDryRunEndpointSafe(endpoint);
}

export type ScheduleOperationalSaveGateInput = {
  authenticated: boolean;
  dryRunSucceeded: boolean;
  formMatchesDryRunSnapshot: boolean;
  mode: "edit" | "create";
  expectedBeforeUpdatedAt: string | null;
  saveEndpointConfigured: boolean;
  saveEndpointSafe: boolean;
  envArmed: boolean;
  approvalId: string;
  expectedApprovalId: string;
  saveInFlight: boolean;
};

export function evaluateScheduleOperationalSaveGate(
  input: ScheduleOperationalSaveGateInput,
): { enabled: boolean; reason: string } {
  if (input.saveInFlight) {
    return { enabled: false, reason: "保存処理中です…" };
  }
  if (!input.authenticated) {
    return { enabled: false, reason: "ログインが必要です" };
  }
  if (!input.dryRunSucceeded) {
    return { enabled: false, reason: "入力内容を確認してください" };
  }
  if (!input.formMatchesDryRunSnapshot) {
    return {
      enabled: false,
      reason: "内容が変わりました。もう一度保存してください",
    };
  }
  if (input.mode === "edit") {
    const lock = String(input.expectedBeforeUpdatedAt ?? "").trim();
    if (!lock) {
      return { enabled: false, reason: "optimistic lock（updated_at）がありません" };
    }
  } else if (String(input.expectedBeforeUpdatedAt ?? "").trim()) {
    return { enabled: false, reason: "create は lock を流用できません" };
  }
  if (!input.saveEndpointConfigured || !input.saveEndpointSafe) {
    return { enabled: false, reason: "Save endpoint が未設定またはブロックされています" };
  }
  if (!input.envArmed) {
    return {
      enabled: false,
      reason: `env arm（${G20U45_SCHEDULE_SAVE_UI_ARMED_ENV}）が無効です`,
    };
  }
  const candidateApprovalId = String(input.approvalId ?? "").trim();
  const expectedApprovalId = String(input.expectedApprovalId ?? "").trim();
  if (!candidateApprovalId) {
    return { enabled: false, reason: "approval ID が空です" };
  }
  if (!expectedApprovalId) {
    return { enabled: false, reason: "expected approval ID が未設定です" };
  }
  if (candidateApprovalId !== expectedApprovalId) {
    return { enabled: false, reason: "approval ID が一致しません" };
  }
  if (expectedApprovalId !== G20U45_SCHEDULE_SAVE_APPROVAL_ID) {
    return { enabled: false, reason: "expected approval ID が不正です" };
  }
  return { enabled: true, reason: "保存できます（operator 明示操作のみ）" };
}

export function isScheduleSaveConflictResponse(body: unknown): boolean {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const haystack = [String(data.message ?? ""), ...errors].join(" ").toLowerCase();
  return /stale|conflict|optimistic|updated_at|0 rows|already changed/.test(haystack);
}

export type ScheduleSaveEndpointDisplay = {
  httpStatus?: number;
  ok?: boolean;
  operation?: string;
  mode?: string;
  dryRun?: boolean;
  wouldWrite?: boolean;
  changedFields?: string[];
  expectedBeforeUpdatedAt?: string | null;
  target?: unknown;
  errors?: string[];
  warnings?: string[];
  didWrite: boolean;
  dbWrite: boolean;
  networkWrite: boolean;
  saveEnabled: boolean;
  authIssue?: boolean;
  unsafeWriteFlags?: boolean;
  fetchError?: string;
  sensitiveResponseBlocked?: boolean;
};

/**
 * Sanitize Schedule Save response for UI.
 * Success requires didWrite/dbWrite/networkWrite true together; partial write is FAIL.
 */
export function sanitizeScheduleSaveEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): ScheduleSaveEndpointDisplay {
  const rawText = JSON.stringify(body ?? {});
  if (DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS.some((re) => re.test(rawText))) {
    return {
      httpStatus,
      ok: false,
      didWrite: false,
      dbWrite: false,
      networkWrite: false,
      saveEnabled: false,
      sensitiveResponseBlocked: true,
      errors: ["Response contained forbidden content — not displayed"],
    };
  }

  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const didWrite = data.didWrite === true;
  const dbWrite = data.dbWrite === true;
  const networkWrite = data.networkWrite === true;
  const writeFlagsConsistent = didWrite === dbWrite && dbWrite === networkWrite;
  const successWrite = didWrite && dbWrite && networkWrite && writeFlagsConsistent;
  const failureClean = !didWrite && !dbWrite && !networkWrite;
  const authIssue = httpStatus === 401 || httpStatus === 403;
  const httpOk = httpStatus == null || (httpStatus >= 200 && httpStatus < 300);
  const baseOk =
    data.ok === true &&
    data.operation === G20U45_SCHEDULE_SAVE_OPERATION &&
    data.dryRun === false &&
    successWrite &&
    httpOk &&
    writeFlagsConsistent;

  const errors = [
    ...(Array.isArray(data.errors) ? (data.errors as string[]) : []),
    ...(!writeFlagsConsistent || (!successWrite && !failureClean)
      ? ["Unsafe response: write flags inconsistent (FAIL)"]
      : []),
  ];

  return {
    httpStatus,
    ok: baseOk,
    operation: typeof data.operation === "string" ? data.operation : undefined,
    mode: typeof data.mode === "string" ? data.mode : undefined,
    dryRun: data.dryRun === true,
    wouldWrite: typeof data.wouldWrite === "boolean" ? data.wouldWrite : undefined,
    changedFields: Array.isArray(data.changedFields) ? (data.changedFields as string[]) : undefined,
    expectedBeforeUpdatedAt:
      data.expectedBeforeUpdatedAt == null ? null : String(data.expectedBeforeUpdatedAt),
    target: data.target ?? null,
    errors,
    warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : undefined,
    didWrite: successWrite,
    dbWrite: successWrite,
    networkWrite: successWrite,
    saveEnabled: data.saveEnabled === true && successWrite,
    authIssue,
    unsafeWriteFlags: !writeFlagsConsistent || (!successWrite && !failureClean && data.ok === true),
  };
}

export type ScheduleDryRunEndpointDisplay = {
  httpStatus?: number;
  ok?: boolean;
  operation?: string;
  mode?: string;
  dryRun?: boolean;
  wouldWrite?: boolean;
  changedFields?: string[];
  diffSummary?: unknown;
  expectedBeforeUpdatedAt?: string | null;
  target?: unknown;
  errors?: string[];
  warnings?: string[];
  didWrite: false;
  dbWrite: false;
  networkWrite: false;
  saveEnabled: false;
  authIssue?: boolean;
  unsafeWriteFlags?: boolean;
  fetchError?: string;
  sensitiveResponseBlocked?: boolean;
};

/**
 * Sanitize Schedule dry-run response for UI.
 * Forces write flags false; marks unsafe if server claimed a write.
 */
export function sanitizeScheduleDryRunEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): ScheduleDryRunEndpointDisplay {
  const rawText = JSON.stringify(body ?? {});
  if (DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS.some((re) => re.test(rawText))) {
    return {
      httpStatus,
      ok: false,
      didWrite: false,
      dbWrite: false,
      networkWrite: false,
      saveEnabled: false,
      sensitiveResponseBlocked: true,
      errors: ["Response contained forbidden content — not displayed"],
    };
  }

  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const claimedWrite =
    data.didWrite === true ||
    data.dbWrite === true ||
    data.networkWrite === true ||
    data.saveEnabled === true;
  const authIssue = httpStatus === 401 || httpStatus === 403;
  const baseOk = data.ok === true && !claimedWrite && (httpStatus == null || (httpStatus >= 200 && httpStatus < 300));

  return {
    httpStatus,
    ok: baseOk,
    operation: typeof data.operation === "string" ? data.operation : undefined,
    mode: typeof data.mode === "string" ? data.mode : undefined,
    dryRun: data.dryRun === true || data.operation === "dryRun",
    wouldWrite: typeof data.wouldWrite === "boolean" ? data.wouldWrite : undefined,
    changedFields: Array.isArray(data.changedFields) ? (data.changedFields as string[]) : undefined,
    diffSummary: data.diffSummary ?? null,
    expectedBeforeUpdatedAt:
      data.expectedBeforeUpdatedAt == null ? null : String(data.expectedBeforeUpdatedAt),
    target: data.target ?? null,
    errors: [
      ...(Array.isArray(data.errors) ? (data.errors as string[]) : []),
      ...(claimedWrite ? ["Unsafe response: write flag claimed true (FAIL)"] : []),
    ],
    warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : undefined,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    authIssue,
    unsafeWriteFlags: claimedWrite,
  };
}

export function resolveG20u41DiscographySaveEndpoint(env: ImportMetaEnv): string {
  return resolveG20u36cDiscographyDryRunEndpoint(env);
}

export function isG20u41DiscographyOperationalSaveArmed(env: ImportMetaEnv): boolean {
  return String(env[G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV as keyof ImportMetaEnv] ?? "").trim() === "true";
}

export function assertG20u41DiscographySaveEndpointSafe(endpoint: string): boolean {
  return assertG20u36cDiscographyDryRunEndpointSafe(endpoint);
}

export function assertG20u36cDiscographyDryRunEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  return trimmed.includes(G11C4A_STAGING_PROJECT_REF);
}

/**
 * Build clientDryRun snapshot for Edge dry-run POST.
 * Diff stats may come from local UI validation; wouldWrite is always false (browser never writes).
 */
export function buildDiscographyDryRunClientSnapshot(
  localDryRun?: Pick<
    DiscographyTrackListDryRunResult,
    "totalBefore" | "totalAfter" | "added" | "removed" | "reordered"
  >,
): DiscographyDryRunClientSnapshot {
  return {
    totalBefore: localDryRun?.totalBefore ?? 0,
    totalAfter: localDryRun?.totalAfter ?? 0,
    added: localDryRun?.added ?? [],
    removed: localDryRun?.removed ?? [],
    reordered: localDryRun?.reordered ?? false,
    wouldWrite: false,
  };
}

/**
 * Build dry-run endpoint POST payload — operation=dryRun only · never save.
 */
export function buildDiscographyDryRunEndpointRequest(
  input: DiscographyDryRunEndpointRequestInput,
): Record<string, unknown> {
  const release = input.release;
  const expected =
    input.expectedBeforeUpdatedAt != null && String(input.expectedBeforeUpdatedAt).trim() !== ""
      ? String(input.expectedBeforeUpdatedAt).trim()
      : null;
  return {
    operation: G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION,
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    legacyId: input.legacyId,
    approvalId: G20U36C_DISCOGRAPHY_DRY_RUN_APPROVAL_ID,
    expectedBeforeUpdatedAt: expected,
    release: {
      title: release.title,
      artist: release.artist ?? null,
      release_date: release.release_date ?? null,
      label: release.label ?? null,
      catalog_number: release.catalog_number ?? null,
      published: release.published === true,
      cover_image_url: release.cover_image_url ?? null,
      purchase_url: release.purchase_url ?? null,
      streaming_url: release.streaming_url ?? null,
      description: release.description ?? null,
    },
    tracksText: input.tracksText,
    trackPolicy: {
      oneLineOneTrack: true,
      blankLinesIgnored: true,
      allowDuplicateTitles: true,
      allowEmptyTrackList: false,
    },
    clientDryRun: buildDiscographyDryRunClientSnapshot(input.localDryRun),
  };
}

/**
 * Build Save endpoint POST payload — same field values as dry-run · operation=save · G-20u36 approval.
 */
export function buildDiscographySaveEndpointRequest(
  input: DiscographyDryRunEndpointRequestInput,
): Record<string, unknown> {
  const dryRunPayload = buildDiscographyDryRunEndpointRequest(input);
  return {
    ...dryRunPayload,
    operation: G20U41_DISCOGRAPHY_SAVE_OPERATION,
    approvalId: G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID,
  };
}

export interface DiscographyOperationalSaveGateInput {
  authenticated: boolean;
  dryRunSucceeded: boolean;
  formMatchesDryRunSnapshot: boolean;
  expectedBeforeUpdatedAt: string | null;
  saveEndpointConfigured: boolean;
  saveEndpointSafe: boolean;
  envArmed: boolean;
  approvalId: string;
  expectedApprovalId: string;
  saveInFlight: boolean;
}

export function evaluateDiscographyOperationalSaveGate(
  input: DiscographyOperationalSaveGateInput,
): { enabled: boolean; reason: string } {
  if (input.saveInFlight) {
    return { enabled: false, reason: "保存処理中です…" };
  }
  if (!input.authenticated) {
    return { enabled: false, reason: "ログインが必要です" };
  }
  if (!input.dryRunSucceeded) {
    return { enabled: false, reason: "入力内容を確認してください" };
  }
  if (!input.formMatchesDryRunSnapshot) {
    return {
      enabled: false,
      reason: "確認後に内容が変わりました。もう一度保存してください",
    };
  }
  const lock = String(input.expectedBeforeUpdatedAt ?? "").trim();
  if (!lock) {
    return { enabled: false, reason: "更新ロック情報がありません。再読み込みしてください" };
  }
  if (!input.saveEndpointConfigured || !input.saveEndpointSafe) {
    return { enabled: false, reason: "保存先が未設定です" };
  }
  if (!input.envArmed) {
    return {
      enabled: false,
      reason: "保存は現在無効です",
    };
  }
  const candidateApprovalId = String(input.approvalId ?? "").trim();
  const expectedApprovalId = String(input.expectedApprovalId ?? "").trim();
  if (!candidateApprovalId || !expectedApprovalId) {
    return { enabled: false, reason: "保存設定が不完全です" };
  }
  if (candidateApprovalId !== expectedApprovalId) {
    return { enabled: false, reason: "保存設定が一致しません" };
  }
  if (expectedApprovalId !== G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID) {
    return { enabled: false, reason: "保存設定が一致しません" };
  }
  return { enabled: true, reason: "" };
}

export function isDiscographySaveConflictResponse(body: unknown): boolean {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const reasonCode = String(data.reasonCode ?? "").toLowerCase();
  const message = String(data.message ?? "").toLowerCase();
  const errors = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const haystack = [reasonCode, message, ...errors].join(" ");
  return (
    /stale|conflict|optimistic|updated_at|0 rows|already changed/.test(haystack) ||
    data.ok === false && /conflict|stale/.test(haystack)
  );
}

function responseTextLooksSensitive(text: string): boolean {
  return DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitize endpoint response for admin UI display — strip secrets · block sensitive bodies.
 */
export function sanitizeDiscographyDryRunEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): DiscographyDryRunEndpointDisplay {
  const rawText = JSON.stringify(body ?? {});
  if (responseTextLooksSensitive(rawText)) {
    return {
      httpStatus,
      ok: false,
      didWrite: false,
      dbWrite: false,
      networkWrite: false,
      saveEnabled: false,
      sensitiveResponseBlocked: true,
      errors: ["Response contained forbidden content — not displayed"],
    };
  }

  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const diff = (data.diff && typeof data.diff === "object" ? data.diff : {}) as Record<string, unknown>;
  const changedCounts =
    data.changedCounts && typeof data.changedCounts === "object"
      ? (data.changedCounts as Record<string, unknown>)
      : undefined;

  const authIssue = httpStatus === 401 || httpStatus === 403;

  return {
    httpStatus,
    ok: typeof data.ok === "boolean" ? data.ok : undefined,
    operation: typeof data.operation === "string" ? data.operation : undefined,
    wouldWrite: typeof data.wouldWrite === "boolean" ? data.wouldWrite : undefined,
    changedCounts,
    diffSummary: {
      tracksAdded: typeof changedCounts?.tracksAdded === "number" ? changedCounts.tracksAdded : undefined,
      tracksRemoved:
        typeof changedCounts?.tracksRemoved === "number" ? changedCounts.tracksRemoved : undefined,
      tracksReordered:
        typeof changedCounts?.tracksReordered === "boolean" ? changedCounts.tracksReordered : undefined,
      releaseFields: Array.isArray(changedCounts?.releaseFields)
        ? (changedCounts.releaseFields as string[])
        : undefined,
      added: Array.isArray(diff.added) ? (diff.added as string[]) : undefined,
      removed: Array.isArray(diff.removed) ? (diff.removed as string[]) : undefined,
    },
    errors: Array.isArray(data.errors) ? (data.errors as string[]) : undefined,
    warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : undefined,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    authIssue,
    authCategory: authIssue ? "auth_required_bearer_anon" : undefined,
  };
}

export interface DiscographyTrackListChangedLine {
  line: number;
  before: string | null;
  after: string | null;
  kind: "added" | "removed" | "changed";
}

export interface DiscographyTrackListDryRunResult {
  ok: true;
  dryRun: true;
  wouldWrite: false;
  saveEnabled: false;
  networkWrite: false;
  blankLinesIgnored: true;
  legacyId?: string;
  title?: string;
  totalBefore: number;
  totalAfter: number;
  added: string[];
  removed: string[];
  unchanged: number;
  changedLines: DiscographyTrackListChangedLine[];
  reordered: boolean;
}

export interface DiscographyTrackListDryRunBatchResult {
  ok: true;
  dryRun: true;
  wouldWrite: false;
  saveEnabled: false;
  networkWrite: false;
  blankLinesIgnored: true;
  albumCount: number;
  albums: DiscographyTrackListDryRunResult[];
}

/**
 * Parse multiline track list textarea: trim lines, ignore blank lines.
 */
export function parseDiscographyTrackListLines(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Compare original vs edited track list (1 line = 1 track). Browser-only dry-run — no DB write.
 */
export function validateDiscographyTrackListDryRun(
  originalText: string,
  nextText: string,
  meta: { legacyId?: string; title?: string } = {},
): DiscographyTrackListDryRunResult {
  const before = parseDiscographyTrackListLines(originalText);
  const after = parseDiscographyTrackListLines(nextText);

  const beforeRemain = [...before];
  const afterRemain = [...after];
  const removed: string[] = [];
  const added: string[] = [];

  for (let i = beforeRemain.length - 1; i >= 0; i -= 1) {
    const title = beforeRemain[i];
    const matchIdx = afterRemain.indexOf(title);
    if (matchIdx >= 0) {
      beforeRemain.splice(i, 1);
      afterRemain.splice(matchIdx, 1);
    }
  }
  removed.push(...beforeRemain);
  added.push(...afterRemain);

  const unchanged = before.length - removed.length;
  const maxLen = Math.max(before.length, after.length);
  /** @type {DiscographyTrackListChangedLine[]} */
  const changedLines: DiscographyTrackListChangedLine[] = [];
  for (let i = 0; i < maxLen; i += 1) {
    const b = before[i] ?? null;
    const a = after[i] ?? null;
    if (b === a) continue;
    if (b && a) changedLines.push({ line: i + 1, before: b, after: a, kind: "changed" });
    else if (!b && a) changedLines.push({ line: i + 1, before: null, after: a, kind: "added" });
    else if (b && !a) changedLines.push({ line: i + 1, before: b, after: null, kind: "removed" });
  }

  const reordered =
    before.join("\n") !== after.join("\n") && added.length === 0 && removed.length === 0;

  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    legacyId: meta.legacyId,
    title: meta.title,
    totalBefore: before.length,
    totalAfter: after.length,
    added,
    removed,
    unchanged,
    changedLines,
    reordered,
  };
}

/**
 * Dry-run all album track lists in one batch (still no network / DB write).
 */
export function validateDiscographyTrackListDryRunBatch(
  albums: Array<{ legacyId: string; title: string; originalText: string; nextText: string }>,
): DiscographyTrackListDryRunBatchResult {
  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    albumCount: albums.length,
    albums: albums.map((album) =>
      validateDiscographyTrackListDryRun(album.originalText, album.nextText, {
        legacyId: album.legacyId,
        title: album.title,
      }),
    ),
  };
}

export interface GosakiDiscographyEditorAlbumSnapshot {
  legacyId: string;
  title: string;
  artist: string | null;
  releaseDate: string | null;
  label: string | null;
  catalogNumber: string | null;
  published: boolean;
  coverImageUrl: string | null;
  purchaseUrl: string | null;
  streamingUrl: string | null;
  description: string;
  trackListText: string;
  trackCount: number;
}

export interface GosakiDiscographyEditorSnapshot {
  phase: string;
  readOnly: boolean;
  saveEnabled: boolean;
  productionUploadStop: boolean;
  siteSlug: string;
  filteredRead: boolean;
  dataSource: string;
  releaseCount: number;
  trackCount: number;
  albums: GosakiDiscographyEditorAlbumSnapshot[];
}

export function resolveG11c4aDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C4A_STAGING_DRY_RUN_ENDPOINT;
}

export function resolveG11c6aSaveEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_YOUTUBE_URL_SAVE_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C6A_STAGING_SAVE_ENDPOINT;
}

export function isG11c6aSaveEnabled(env: ImportMetaEnv): boolean {
  return String(env.PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED ?? "").trim() === "true";
}

export function assertGosakiYoutubeDryRunEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  if (!trimmed.includes(G11C4A_STAGING_PROJECT_REF)) return false;
  return trimmed.includes("/functions/v1/gosaki-youtube-url-dry-run");
}

export function assertGosakiYoutubeSaveEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  if (!trimmed.includes(G11C4A_STAGING_PROJECT_REF)) return false;
  return trimmed.includes("/functions/v1/gosaki-youtube-url-save");
}

export function buildYoutubeDryRunEndpointRequest(nextValue: string): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G11C1_MODULE,
    field: G11C1_FIELD,
    nextValue: String(nextValue ?? "").trim(),
    dryRun: true,
    operationId: G11C1_OPERATION_ID,
    approvalId: G11C1_APPROVAL_ID,
  };
}

export function buildYoutubeSaveEndpointRequest(input: {
  nextValue: string;
  expectedBefore: { embedCode: string; videoId?: string | null };
  fingerprint: string;
  requestId?: string;
}): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G11C1_MODULE,
    field: G11C1_FIELD,
    nextValue: String(input.nextValue ?? "").trim(),
    dryRun: false,
    saveEnabled: true,
    operationId: G11C6_OPERATION_ID,
    approvalId: G11C6_APPROVAL_ID,
    fingerprint: String(input.fingerprint ?? "").trim(),
    requestId: String(input.requestId ?? `ui-${Date.now()}`).trim(),
    expectedBefore: {
      embedCode: String(input.expectedBefore.embedCode ?? "").trim(),
      videoId:
        input.expectedBefore.videoId == null
          ? null
          : String(input.expectedBefore.videoId).trim() || null,
    },
  };
}

export type YoutubeItemsEndpointItem = {
  id: string;
  published: boolean;
  sortOrder: number;
  embedCode: string;
};

export function buildYoutubeItemsDryRunEndpointRequest(
  items: YoutubeItemsEndpointItem[],
): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G11C1_MODULE,
    field: G11C7_ITEMS_FIELD,
    items: items.map((item) => ({
      id: String(item.id ?? "").trim(),
      published: item.published === true,
      sortOrder: Number(item.sortOrder),
      embedCode: String(item.embedCode ?? "").trim(),
    })),
    dryRun: true,
    operationId: G11C7_ITEMS_DRY_RUN_OPERATION_ID,
    approvalId: G11C7_ITEMS_DRY_RUN_APPROVAL_ID,
  };
}

export function buildYoutubeItemsSaveEndpointRequest(input: {
  items: YoutubeItemsEndpointItem[];
  expectedBeforeItems: YoutubeItemsEndpointItem[];
  fingerprint: string;
  requestId?: string;
}): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G11C1_MODULE,
    field: G11C7_ITEMS_FIELD,
    items: input.items.map((item) => ({
      id: String(item.id ?? "").trim(),
      published: item.published === true,
      sortOrder: Number(item.sortOrder),
      embedCode: String(item.embedCode ?? "").trim(),
    })),
    dryRun: false,
    saveEnabled: true,
    operationId: G11C7_ITEMS_SAVE_OPERATION_ID,
    approvalId: G11C7_ITEMS_SAVE_APPROVAL_ID,
    fingerprint: String(input.fingerprint ?? "").trim(),
    requestId: String(input.requestId ?? `ui-items-${Date.now()}`).trim(),
    expectedBeforeItems: input.expectedBeforeItems.map((item) => ({
      id: String(item.id ?? "").trim(),
      published: item.published === true,
      sortOrder: Number(item.sortOrder),
      embedCode: String(item.embedCode ?? "").trim(),
    })),
  };
}

export type YoutubeOperationalSaveGateInput = {
  authenticated: boolean;
  dryRunSucceeded: boolean;
  formMatchesDryRunSnapshot: boolean;
  fingerprintPresent: boolean;
  expectedBeforeEmbed: string | null;
  expectedBeforeVideoId: string | null;
  /** Default embed — items[] Save uses fingerprint + expectedBeforeItems instead. */
  contentLockMode?: "embed" | "items";
  saveEndpointConfigured: boolean;
  saveEndpointSafe: boolean;
  envArmed: boolean;
  approvalId: string;
  expectedApprovalId: string;
  saveInFlight: boolean;
  noChange?: boolean;
};

export function evaluateYoutubeOperationalSaveGate(
  input: YoutubeOperationalSaveGateInput,
): { enabled: boolean; reason: string } {
  if (input.saveInFlight) {
    return { enabled: false, reason: "保存処理中です…" };
  }
  if (!input.authenticated) {
    return { enabled: false, reason: "ログインが必要です" };
  }
  if (!input.dryRunSucceeded) {
    return { enabled: false, reason: "入力内容を確認してください" };
  }
  if (input.noChange) {
    return { enabled: false, reason: "変更がありません（no_change）" };
  }
  if (!input.formMatchesDryRunSnapshot) {
    return {
      enabled: false,
      reason: "内容が変わりました。もう一度保存してください",
    };
  }
  if (!input.fingerprintPresent) {
    return { enabled: false, reason: "確認情報の取得に失敗しました。もう一度お試しください" };
  }
  const lockMode = input.contentLockMode === "items" ? "items" : "embed";
  if (lockMode === "embed") {
    const embed = String(input.expectedBeforeEmbed ?? "").trim();
    if (!embed) {
      return { enabled: false, reason: "content lock（expectedBefore.embedCode）がありません" };
    }
  }
  if (!input.saveEndpointConfigured || !input.saveEndpointSafe) {
    return { enabled: false, reason: "Save endpoint が未設定またはブロックされています" };
  }
  if (!input.envArmed) {
    return {
      enabled: false,
      reason: `env arm（${G11C6_SAVE_UI_ARMED_ENV}）が無効です`,
    };
  }
  const candidateApprovalId = String(input.approvalId ?? "").trim();
  const expectedApprovalId = String(input.expectedApprovalId ?? "").trim();
  if (!candidateApprovalId) {
    return { enabled: false, reason: "approval ID が空です" };
  }
  if (!expectedApprovalId) {
    return { enabled: false, reason: "expected approval ID が未設定です" };
  }
  if (candidateApprovalId !== expectedApprovalId) {
    return { enabled: false, reason: "approval ID が一致しません" };
  }
  if (expectedApprovalId !== G11C6_APPROVAL_ID) {
    return { enabled: false, reason: "expected approval ID が不正です" };
  }
  return { enabled: true, reason: "保存できます（operator 明示操作のみ）" };
}

export function isYoutubeSaveConflictResponse(body: unknown): boolean {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const readiness = String(data.saveReadiness ?? "").toLowerCase();
  const error = String(data.error ?? "").toLowerCase();
  const message = String(data.message ?? "").toLowerCase();
  return (
    readiness === "conflict" ||
    /expectedbefore|conflict|stale|already changed|file sha/.test(`${error} ${message}`)
  );
}

export type YoutubeEndpointDisplay = {
  httpStatus?: number;
  ok?: boolean;
  dryRun?: boolean;
  wouldWrite?: boolean;
  changedFields?: string[];
  current?: { embedCode?: string; videoId?: string | null };
  next?: { embedCode?: string; videoId?: string | null };
  before?: { embedCode?: string; videoId?: string | null };
  after?: { embedCode?: string; videoId?: string | null };
  fingerprint?: string;
  currentFileSha?: string;
  newFileSha?: string;
  commitSha?: string;
  commitUrl?: string | null;
  error?: string;
  errors: string[];
  saveReadiness?: string;
  didWrite: boolean;
  dbWrite: boolean;
  networkWrite: boolean;
  saveEnabled: boolean;
  authIssue?: boolean;
  unsafeWriteFlags?: boolean;
  fetchError?: string;
  noChange?: boolean;
  indeterminate?: boolean;
};

function youtubeUnsafeDryRunFlags(data: Record<string, unknown>): boolean {
  return (
    data.wouldWrite === true ||
    data.didWrite === true ||
    data.dbWrite === true ||
    data.networkWrite === true ||
    data.workflowDispatchExecuted === true
  );
}

function youtubeUnsafeSaveFlags(data: Record<string, unknown>): boolean {
  if (data.workflowDispatchExecuted === true) return true;
  if (data.dbWrite === true) return true;
  if (data.ok === true && data.didWrite === true && !data.commitSha) return true;
  return false;
}

export function sanitizeYoutubeDryRunEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): YoutubeEndpointDisplay {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : undefined;
  const errorsFromArray = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const errors = error ? Array.from(new Set([error, ...errorsFromArray])) : errorsFromArray;
  const unsafe = youtubeUnsafeDryRunFlags(data);
  const fingerprint = typeof data.fingerprint === "string" ? data.fingerprint : undefined;
  const noChange = data.noChange === true || data.saveReadiness === "no_change";
  const ok =
    data.ok === true &&
    !unsafe &&
    errors.length === 0 &&
    data.dryRun === true &&
    Boolean(fingerprint) &&
    !noChange;
  return {
    httpStatus,
    ok,
    dryRun: data.dryRun === true,
    wouldWrite: data.wouldWrite === true,
    changedFields: Array.isArray(data.changedFields) ? data.changedFields.map(String) : [],
    current:
      data.current && typeof data.current === "object"
        ? (data.current as YoutubeEndpointDisplay["current"])
        : data.before && typeof data.before === "object"
          ? (data.before as YoutubeEndpointDisplay["current"])
          : undefined,
    next:
      data.next && typeof data.next === "object"
        ? (data.next as YoutubeEndpointDisplay["next"])
        : data.after && typeof data.after === "object"
          ? (data.after as YoutubeEndpointDisplay["next"])
          : undefined,
    before:
      data.before && typeof data.before === "object"
        ? (data.before as YoutubeEndpointDisplay["before"])
        : undefined,
    after:
      data.after && typeof data.after === "object"
        ? (data.after as YoutubeEndpointDisplay["after"])
        : undefined,
    fingerprint,
    currentFileSha:
      typeof data.currentFileSha === "string" ? data.currentFileSha : undefined,
    error,
    errors,
    saveReadiness: typeof data.saveReadiness === "string" ? data.saveReadiness : undefined,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    authIssue: httpStatus === 401 || httpStatus === 403,
    unsafeWriteFlags: unsafe,
    noChange,
  };
}

export function sanitizeYoutubeSaveEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): YoutubeEndpointDisplay {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : undefined;
  const errorsFromArray = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const errors = error ? Array.from(new Set([error, ...errorsFromArray])) : errorsFromArray;
  const unsafe = youtubeUnsafeSaveFlags(data);
  const indeterminate =
    data.indeterminate === true || String(data.saveReadiness ?? "") === "verification_required";
  const committed =
    data.ok === true &&
    data.didWrite === true &&
    typeof data.commitSha === "string" &&
    String(data.commitSha).trim() !== "" &&
    !unsafe &&
    !indeterminate &&
    errors.length === 0;
  return {
    httpStatus,
    ok: committed,
    dryRun: data.dryRun === false ? false : data.dryRun === true,
    wouldWrite: data.wouldWrite === true,
    changedFields: Array.isArray(data.changedFields) ? data.changedFields.map(String) : [],
    current:
      data.current && typeof data.current === "object"
        ? (data.current as YoutubeEndpointDisplay["current"])
        : undefined,
    next:
      data.next && typeof data.next === "object"
        ? (data.next as YoutubeEndpointDisplay["next"])
        : undefined,
    before:
      data.before && typeof data.before === "object"
        ? (data.before as YoutubeEndpointDisplay["before"])
        : undefined,
    after:
      data.after && typeof data.after === "object"
        ? (data.after as YoutubeEndpointDisplay["after"])
        : undefined,
    fingerprint: typeof data.fingerprint === "string" ? data.fingerprint : undefined,
    currentFileSha:
      typeof data.currentFileSha === "string"
        ? data.currentFileSha
        : typeof data.newFileSha === "string"
          ? data.newFileSha
          : undefined,
    newFileSha: typeof data.newFileSha === "string" ? data.newFileSha : undefined,
    commitSha: typeof data.commitSha === "string" ? data.commitSha : undefined,
    commitUrl: typeof data.commitUrl === "string" ? data.commitUrl : null,
    error,
    errors,
    saveReadiness: typeof data.saveReadiness === "string" ? data.saveReadiness : undefined,
    didWrite: data.didWrite === true,
    dbWrite: false,
    networkWrite: data.networkWrite === true,
    saveEnabled: false,
    authIssue: httpStatus === 401 || httpStatus === 403,
    unsafeWriteFlags: unsafe,
    noChange: data.noChange === true,
    indeterminate,
  };
}

export function resolveG11c4aSupabaseUrl(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C4A_STAGING_SUPABASE_URL;
}

export function resolveG11c4aSupabaseAnonKey(env: ImportMetaEnv): string {
  return String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

export function isG11c4aSupabaseAuthConfigured(env: ImportMetaEnv): boolean {
  return Boolean(resolveG11c4aSupabaseUrl(env) && resolveG11c4aSupabaseAnonKey(env));
}

export interface GosakiAboutContentBlock {
  id?: string;
  label?: string;
  enabled?: boolean;
  html?: string;
}

export interface GosakiAboutContentConfig {
  siteSlug?: string;
  blocks?: GosakiAboutContentBlock[];
}

export interface GosakiContactHubspotConfig {
  siteSlug?: string;
  provider?: string;
  region?: string;
  portalId?: string;
  formId?: string;
  enabled?: boolean;
}

export interface GosakiReadOnlyAdminBandImage {
  fileName: string;
  bandName: string | null;
}

export interface GosakiReadOnlyAdminViewModel {
  siteSlug: string;
  stagingUrl: string;
  noindex: boolean;
  packageNote: string;
  youtube: {
    sourceUrl: string;
    videoId: string | null;
    published: boolean;
  };
  about: {
    profileLabel: string;
    profileSummary: string;
    profileCharCount: number;
    profileHtml: string;
    bandsLabel: string;
    bandsSummary: string;
    bandsCharCount: number;
    bandsHtml: string;
    bandImages: GosakiReadOnlyAdminBandImage[];
  };
  contact: {
    provider: string;
    portalId: string;
    formId: string;
    region: string;
    enabled: boolean;
  };
  schedule: {
    status: string;
    note: string;
  };
}

/**
 * Strip HTML to a short plain-text preview.
 */
export function htmlToPlainSummary(html: string, maxLen = 240): string {
  const text = String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

/**
 * Extract band image file names from about-bands-html block.
 */
export function extractBandImageFileNames(bandsHtml: string): string[] {
  const matches = String(bandsHtml ?? "").matchAll(
    /assets\/about\/bands\/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))/gi,
  );
  const seen = new Set<string>();
  const files: string[] = [];
  for (const match of matches) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      files.push(name);
    }
  }
  return files;
}

/**
 * Map image file to band name from adjacent alt text when possible.
 */
export function extractBandImagesWithNames(bandsHtml: string): GosakiReadOnlyAdminBandImage[] {
  const fileNames = extractBandImageFileNames(bandsHtml);
  return fileNames.map((fileName) => {
    const altMatch = bandsHtml.match(
      new RegExp(
        `assets/about/bands/${fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*alt="([^"]*)"`,
        "i",
      ),
    );
    return { fileName, bandName: altMatch?.[1]?.trim() || null };
  });
}

function findAboutBlock(config: GosakiAboutContentConfig, id: string) {
  return config.blocks?.find((block) => block?.id === id) ?? null;
}

/**
 * Build read-only admin view model from static JSON configs.
 */
export function buildGosakiReadOnlyAdminViewModel(input: {
  youtube: GosakiYoutubeEmbedConfig;
  about: GosakiAboutContentConfig;
  contact: GosakiContactHubspotConfig;
}): GosakiReadOnlyAdminViewModel {
  const youtubeItem = input.youtube.items?.[0];
  const publishedItems = resolvePublishedGosakiYoutubeItems(input.youtube);
  const resolved = publishedItems[0] ?? null;
  const embedCode = String(youtubeItem?.embedCode ?? "").trim();
  const videoId =
    resolved?.videoId ??
    parseYoutubeVideoId(youtubeItem?.videoId) ??
    parseYoutubeVideoId(youtubeItem?.sourceUrl) ??
    parseYoutubeVideoId(embedCode);

  const profileBlock = findAboutBlock(input.about, "about-profile-html");
  const bandsBlock = findAboutBlock(input.about, "about-bands-html");
  const profileHtml = String(profileBlock?.html ?? "");
  const bandsHtml = String(bandsBlock?.html ?? "");

  return {
    siteSlug: input.about.siteSlug ?? input.youtube.siteSlug ?? GOSAKI_STAGING_SITE_SLUG,
    stagingUrl: GOSAKI_STAGING_PREVIEW_URL,
    noindex: true,
    packageNote:
      "表示内容はローカル convert / build 時の config JSON に基づきます。staging へ反映するには manual-upload package の再アップロードが必要です。",
    youtube: {
      sourceUrl: embedCode || resolved?.watchUrl || "",
      videoId,
      published: youtubeItem?.published === true && Boolean(videoId),
    },
    about: {
      profileLabel: String(profileBlock?.label ?? "About profile"),
      profileSummary: htmlToPlainSummary(profileHtml),
      profileCharCount: profileHtml.length,
      profileHtml,
      bandsLabel: String(bandsBlock?.label ?? "Bands / Projects"),
      bandsSummary: htmlToPlainSummary(bandsHtml),
      bandsCharCount: bandsHtml.length,
      bandsHtml,
      bandImages: extractBandImagesWithNames(bandsHtml),
    },
    contact: {
      provider: String(input.contact.provider ?? "hubspot"),
      portalId: String(input.contact.portalId ?? ""),
      formId: String(input.contact.formId ?? ""),
      region: String(input.contact.region ?? ""),
      enabled: input.contact.enabled !== false,
    },
    schedule: {
      status: "read-only",
      note: "build 時スナップショットの公演一覧です。保存は無効です。公開ページへの反映は管理者が行います。",
    },
  };
}

/** G-12a — About content GitHub Contents dry-run / Save (staging only · default disarmed). */
export const G12A_ABOUT_DRY_RUN_OPERATION_ID = "G-12a-gosaki-about-content-dry-run";
export const G12A_ABOUT_DRY_RUN_APPROVAL_ID = "G-12a-gosaki-about-content-dry-run";
export const G12A_ABOUT_SAVE_OPERATION_ID = "G-12a-gosaki-about-content-web-save-non-dry-run-slice";
export const G12A_ABOUT_SAVE_APPROVAL_ID = "G-12a-gosaki-about-content-web-save-non-dry-run-slice";
export const G12A_ABOUT_MODULE = "about-content";
export const G12A_ABOUT_SAVE_UI_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED";
export const G12A_ABOUT_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-about-content-dry-run`;
export const G12A_ABOUT_SAVE_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-about-content-save`;
export const G12A_ABOUT_SAVE_DISABLED_REASON =
  "保存は現在無効です";
export const G12A_ABOUT_CONFLICT_MESSAGE =
  "他の場所で更新された可能性があります。再読み込みしてください。";

export type AboutContentFormSnapshot = {
  profile: { heading: string; body: string; imageAlt: string };
  bands: Array<{ id: string; name: string; body: string; imageAlt: string }>;
};

export function resolveG12aAboutDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_ABOUT_CONTENT_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G12A_ABOUT_DRY_RUN_ENDPOINT;
}

export function resolveG12aAboutSaveEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_ABOUT_CONTENT_SAVE_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G12A_ABOUT_SAVE_ENDPOINT;
}

export function isG12aAboutSaveEnabled(env: ImportMetaEnv): boolean {
  return String(env.PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED ?? "").trim() ===
    "true";
}

export function assertGosakiAboutDryRunEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  if (!trimmed.includes(G11C4A_STAGING_PROJECT_REF)) return false;
  return trimmed.includes("/functions/v1/gosaki-about-content-dry-run");
}

export function assertGosakiAboutSaveEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  if (!trimmed.includes(G11C4A_STAGING_PROJECT_REF)) return false;
  return trimmed.includes("/functions/v1/gosaki-about-content-save");
}

export function buildAboutDryRunEndpointRequest(
  next: AboutContentFormSnapshot,
): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G12A_ABOUT_MODULE,
    next,
    dryRun: true,
    operationId: G12A_ABOUT_DRY_RUN_OPERATION_ID,
    approvalId: G12A_ABOUT_DRY_RUN_APPROVAL_ID,
  };
}

export function buildAboutSaveEndpointRequest(input: {
  next: AboutContentFormSnapshot;
  expectedBefore: AboutContentFormSnapshot;
  fingerprint: string;
  requestId?: string;
}): Record<string, unknown> {
  return {
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    module: G12A_ABOUT_MODULE,
    next: input.next,
    dryRun: false,
    saveEnabled: true,
    operationId: G12A_ABOUT_SAVE_OPERATION_ID,
    approvalId: G12A_ABOUT_SAVE_APPROVAL_ID,
    fingerprint: String(input.fingerprint ?? "").trim(),
    requestId: String(input.requestId ?? `ui-${Date.now()}`).trim(),
    expectedBefore: input.expectedBefore,
  };
}

export type AboutOperationalSaveGateInput = {
  authenticated: boolean;
  dryRunSucceeded: boolean;
  formMatchesDryRunSnapshot: boolean;
  fingerprintPresent: boolean;
  expectedBeforePresent: boolean;
  saveEndpointConfigured: boolean;
  saveEndpointSafe: boolean;
  envArmed: boolean;
  approvalId: string;
  expectedApprovalId: string;
  saveInFlight: boolean;
  noChange?: boolean;
};

export function evaluateAboutOperationalSaveGate(
  input: AboutOperationalSaveGateInput,
): { enabled: boolean; reason: string } {
  if (input.saveInFlight) return { enabled: false, reason: "保存処理中です…" };
  if (!input.authenticated) return { enabled: false, reason: "ログインが必要です" };
  if (!input.dryRunSucceeded) {
    return { enabled: false, reason: "入力内容を確認してください" };
  }
  if (input.noChange) return { enabled: false, reason: "変更がありません（no_change）" };
  if (!input.formMatchesDryRunSnapshot) {
    return {
      enabled: false,
      reason: "内容が変わりました。もう一度保存してください",
    };
  }
  if (!input.fingerprintPresent) {
    return { enabled: false, reason: "確認情報の取得に失敗しました。もう一度お試しください" };
  }
  if (!input.expectedBeforePresent) {
    return { enabled: false, reason: "content lock（expectedBefore）がありません" };
  }
  if (!input.saveEndpointConfigured || !input.saveEndpointSafe) {
    return { enabled: false, reason: "Save endpoint が未設定またはブロックされています" };
  }
  if (!input.envArmed) {
    return { enabled: false, reason: `env arm（${G12A_ABOUT_SAVE_UI_ARMED_ENV}）が無効です` };
  }
  const candidateApprovalId = String(input.approvalId ?? "").trim();
  const expectedApprovalId = String(input.expectedApprovalId ?? "").trim();
  if (!candidateApprovalId) return { enabled: false, reason: "approval ID が空です" };
  if (!expectedApprovalId) return { enabled: false, reason: "expected approval ID が未設定です" };
  if (candidateApprovalId !== expectedApprovalId) {
    return { enabled: false, reason: "approval ID が一致しません" };
  }
  if (expectedApprovalId !== G12A_ABOUT_SAVE_APPROVAL_ID) {
    return { enabled: false, reason: "expected approval ID が不正です" };
  }
  return { enabled: true, reason: "Save 可能（gated）" };
}

export function isAboutSaveConflictResponse(body: unknown): boolean {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const readiness = String(data.saveReadiness ?? "").toLowerCase();
  const error = String(data.error ?? "").toLowerCase();
  const message = String(data.message ?? "").toLowerCase();
  return (
    readiness === "conflict" ||
    /expectedbefore|conflict|stale|already changed|file sha/.test(`${error} ${message}`)
  );
}

export type AboutEndpointDisplay = {
  httpStatus?: number;
  ok?: boolean;
  dryRun?: boolean;
  wouldWrite?: boolean;
  changedFields?: string[];
  current?: AboutContentFormSnapshot;
  next?: AboutContentFormSnapshot;
  before?: AboutContentFormSnapshot;
  after?: AboutContentFormSnapshot;
  fingerprint?: string;
  currentFileSha?: string;
  newFileSha?: string;
  commitSha?: string;
  commitUrl?: string | null;
  error?: string;
  errors: string[];
  saveReadiness?: string;
  didWrite: boolean;
  dbWrite: boolean;
  networkWrite: boolean;
  saveEnabled: boolean;
  authIssue?: boolean;
  unsafeWriteFlags?: boolean;
  fetchError?: string;
  noChange?: boolean;
  indeterminate?: boolean;
};

function aboutUnsafeDryRunFlags(data: Record<string, unknown>): boolean {
  return (
    data.wouldWrite === true ||
    data.didWrite === true ||
    data.dbWrite === true ||
    data.networkWrite === true ||
    data.workflowDispatchExecuted === true
  );
}

function aboutUnsafeSaveFlags(data: Record<string, unknown>): boolean {
  if (data.workflowDispatchExecuted === true) return true;
  if (data.dbWrite === true) return true;
  if (data.ok === true && data.didWrite === true && !data.commitSha) return true;
  return false;
}

function asAboutSnapshot(value: unknown): AboutContentFormSnapshot | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as AboutContentFormSnapshot;
}

export function sanitizeAboutDryRunEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): AboutEndpointDisplay {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : undefined;
  const errorsFromArray = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const errors = error ? Array.from(new Set([error, ...errorsFromArray])) : errorsFromArray;
  const unsafe = aboutUnsafeDryRunFlags(data);
  const fingerprint = typeof data.fingerprint === "string" ? data.fingerprint : undefined;
  const noChange = data.noChange === true || data.saveReadiness === "no_change";
  const ok =
    data.ok === true &&
    !unsafe &&
    errors.length === 0 &&
    data.dryRun === true &&
    Boolean(fingerprint) &&
    !noChange;
  return {
    httpStatus,
    ok,
    dryRun: data.dryRun === true,
    wouldWrite: data.wouldWrite === true,
    changedFields: Array.isArray(data.changedFields) ? data.changedFields.map(String) : [],
    current: asAboutSnapshot(data.current) ?? asAboutSnapshot(data.before),
    next: asAboutSnapshot(data.next) ?? asAboutSnapshot(data.after),
    before: asAboutSnapshot(data.before),
    after: asAboutSnapshot(data.after),
    fingerprint,
    currentFileSha: typeof data.currentFileSha === "string" ? data.currentFileSha : undefined,
    error,
    errors,
    saveReadiness: typeof data.saveReadiness === "string" ? data.saveReadiness : undefined,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    authIssue: httpStatus === 401 || httpStatus === 403,
    unsafeWriteFlags: unsafe,
    noChange,
  };
}

export function sanitizeAboutSaveEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): AboutEndpointDisplay {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : undefined;
  const errorsFromArray = Array.isArray(data.errors) ? data.errors.map(String) : [];
  const errors = error ? Array.from(new Set([error, ...errorsFromArray])) : errorsFromArray;
  const unsafe = aboutUnsafeSaveFlags(data);
  const indeterminate =
    data.indeterminate === true || String(data.saveReadiness ?? "") === "verification_required";
  const committed =
    data.ok === true &&
    data.didWrite === true &&
    typeof data.commitSha === "string" &&
    String(data.commitSha).trim() !== "" &&
    !unsafe &&
    !indeterminate &&
    errors.length === 0;
  return {
    httpStatus,
    ok: committed,
    dryRun: data.dryRun === false ? false : data.dryRun === true,
    wouldWrite: data.wouldWrite === true,
    changedFields: Array.isArray(data.changedFields) ? data.changedFields.map(String) : [],
    current: asAboutSnapshot(data.current),
    next: asAboutSnapshot(data.next),
    before: asAboutSnapshot(data.before),
    after: asAboutSnapshot(data.after),
    fingerprint: typeof data.fingerprint === "string" ? data.fingerprint : undefined,
    currentFileSha: typeof data.currentFileSha === "string" ? data.currentFileSha : undefined,
    newFileSha: typeof data.newFileSha === "string" ? data.newFileSha : undefined,
    commitSha: typeof data.commitSha === "string" ? data.commitSha : undefined,
    commitUrl: typeof data.commitUrl === "string" ? data.commitUrl : null,
    error,
    errors,
    saveReadiness: typeof data.saveReadiness === "string" ? data.saveReadiness : undefined,
    didWrite: committed,
    dbWrite: false,
    networkWrite: committed,
    saveEnabled: false,
    authIssue: httpStatus === 401 || httpStatus === 403,
    unsafeWriteFlags: unsafe,
    indeterminate,
  };
}