/**
 * G-20u36b / G-20u36d / G-20u36e / G-20u36f — Gosaki Discography Edge dry-run (+ controlled Save).
 * Ported from gosaki-discography-edge-dry-run-endpoint-inert.mjs + G-20u33 draft + G-20u36d readBack.
 * Copied from tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts
 * Controlled Save: allowlisted slices only · user JWT + is_admin + title-only UPDATE · no service_role.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const G20U36D_READBACK_ROOT_PLACEMENT_PHASE = "G-20u36d-readback-root-placement";
export const G20U36D_RELEASE_ID_SELECT_FIX_ROOT_PLACEMENT_PHASE =
  "G-20u36d-readback-release-id-select-fix-root-placement";
export const G20U36D_TRACKS_SELECT_FIELDS_FIX_ROOT_PLACEMENT_PHASE =
  "G-20u36d-readback-tracks-select-fields-fix-root-placement";
export const G20U36D_TRACKS_RELATION_FILTER_FIX_ROOT_PLACEMENT_PHASE =
  "G-20u36d-readback-tracks-relation-filter-fix-root-placement";
export const READBACK_SOURCE = "supabase-select";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

export const ENDPOINT_NAME = "gosaki-discography-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const DRY_RUN_OPERATION = "dryRun";
export const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
export const SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";

/** G-20u36e — one-off controlled Save slice (local implementation · not deployed in this phase). */
export const CONTROLLED_SAVE_OPERATION = "save";
export const CONTROLLED_SAVE_SLICE_ID =
  "G-20u36e1-discography-002-track-1-title-staging-marker";
export const CONTROLLED_SAVE_LEGACY_ID = "discography-002";
export const CONTROLLED_SAVE_TARGET_ROW_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
export const CONTROLLED_SAVE_TRACK_NUMBER = 1;
export const CONTROLLED_SAVE_TRACK_COUNT = 8;
export const CONTROLLED_SAVE_TITLE_BEFORE = "On a Clear Day";
export const CONTROLLED_SAVE_TITLE_AFTER =
  "On a Clear Day [CMS Kit staging G-20u36e]";
export const CONTROLLED_SAVE_TRACK_7_TITLE = "Like a Lover";
export const CONTROLLED_SAVE_PHASE =
  "G-20u36e-controlled-save-handler-permission-aware-local-implementation";

/** G-20u36f — marker title restore slice (local implementation · deploy in later phase). */
export const G20U36F_RESTORE_APPROVAL_ID =
  "G-20u36f-gosaki-discography-marker-title-restore";
export const G20U36F_RESTORE_SLICE_ID =
  "G-20u36f-discography-002-track-1-title-restore";
export const G20U36F_RESTORE_TITLE_BEFORE =
  "On a Clear Day [CMS Kit staging G-20u36e]";
export const G20U36F_RESTORE_TITLE_AFTER = "On a Clear Day";
export const G20U36F_RESTORE_PHASE =
  "G-20u36f-discography-marker-title-restore-handler-implementation";

export type ControlledSaveSliceSpec = {
  sliceKey: string;
  approvalId: string;
  sliceId: string;
  siteSlug: string;
  legacyId: string;
  targetRowId: string;
  trackNumber: number;
  trackCount: number;
  track7Title: string;
  beforeTitle: string;
  afterTitle: string;
  phase: string;
};

/** Explicit allowlist — no unlisted Save slices permitted. */
export const CONTROLLED_SAVE_SLICE_ALLOWLIST: ControlledSaveSliceSpec[] = [
  {
    sliceKey: "G-20u36e",
    approvalId: SAVE_APPROVAL_ID,
    sliceId: CONTROLLED_SAVE_SLICE_ID,
    siteSlug: SITE_SLUG,
    legacyId: CONTROLLED_SAVE_LEGACY_ID,
    targetRowId: CONTROLLED_SAVE_TARGET_ROW_ID,
    trackNumber: CONTROLLED_SAVE_TRACK_NUMBER,
    trackCount: CONTROLLED_SAVE_TRACK_COUNT,
    track7Title: CONTROLLED_SAVE_TRACK_7_TITLE,
    beforeTitle: CONTROLLED_SAVE_TITLE_BEFORE,
    afterTitle: CONTROLLED_SAVE_TITLE_AFTER,
    phase: CONTROLLED_SAVE_PHASE,
  },
  {
    sliceKey: "G-20u36f",
    approvalId: G20U36F_RESTORE_APPROVAL_ID,
    sliceId: G20U36F_RESTORE_SLICE_ID,
    siteSlug: SITE_SLUG,
    legacyId: CONTROLLED_SAVE_LEGACY_ID,
    targetRowId: CONTROLLED_SAVE_TARGET_ROW_ID,
    trackNumber: CONTROLLED_SAVE_TRACK_NUMBER,
    trackCount: CONTROLLED_SAVE_TRACK_COUNT,
    track7Title: CONTROLLED_SAVE_TRACK_7_TITLE,
    beforeTitle: G20U36F_RESTORE_TITLE_BEFORE,
    afterTitle: G20U36F_RESTORE_TITLE_AFTER,
    phase: G20U36F_RESTORE_PHASE,
  },
];

/** Supabase service_role — NOT CONNECTED · controlled Save uses user JWT + anon key only. */
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

const RELEASE_FIELDS = [
  "title",
  "artist",
  "release_date",
  "label",
  "catalog_number",
  "published",
  "cover_image_url",
  "purchase_url",
  "streaming_url",
  "description",
] as const;

const SAVE_APPROVAL_REGISTRY = [
  { approvalId: DRY_RUN_APPROVAL_ID, operation: "dryRun" as const },
  { approvalId: SAVE_APPROVAL_ID, operation: "save" as const },
];

export type CurrentSnapshot = {
  tracksText?: string;
  release?: Record<string, unknown>;
};

export type DryRunRequest = Record<string, unknown>;

export type DryRunHandlerResult = Record<string, unknown> & {
  status: number;
};

export type ReadBackQueryAdapter = {
  fetchRelease(input: { siteSlug: string; legacyId: string }): Promise<Record<string, unknown> | null>;
  fetchTracks(input: { siteSlug: string; legacyId: string }): Promise<Array<Record<string, unknown>>>;
};

export type SanitizedReadBackSummary = {
  enabled: boolean;
  source: typeof READBACK_SOURCE;
  releaseFound: boolean;
  trackCount: number;
  legacyId: string;
  siteSlug: string;
};

/** PostgREST release SELECT — may include internal `id` (not used for tracks relation · not in readBack summary). */
const RELEASE_SELECT_FIELDS = [
  "id",
  "legacy_id",
  "site_slug",
  "title",
  "artist",
  "release_date",
  "year",
  "label",
  "catalog_number",
  "description",
  "cover_image_url",
  "purchase_url",
  "streaming_url",
  "sort_order",
  "published",
].join(",");

/** PostgREST tracks SELECT — staging columns only; `duration` omitted (column absent on staging). */
const TRACK_SELECT_FIELDS = ["track_number", "title", "sort_order", "site_slug"].join(",");

const WRITE_FLAGS = {
  didWrite: false,
  dbWrite: false,
  networkWrite: false,
  saveEnabled: false,
} as const;

function lookupApprovalEntry(approvalId: string) {
  return SAVE_APPROVAL_REGISTRY.find((entry) => entry.approvalId === approvalId) ?? null;
}

export function getDryRunApprovalRequirements() {
  return {
    operation: DRY_RUN_OPERATION,
    approvalId: DRY_RUN_APPROVAL_ID,
    siteSlug: SITE_SLUG,
    endpoint: ENDPOINT_NAME,
    humanConfirmationRequired: true,
    description: "Server dry-run endpoint wiring (G-20u33+)",
  };
}

/**
 * Schema-only baseline when readBack is disabled — returns empty snapshot.
 */
export function resolveCurrentSnapshot(_legacyId: string): CurrentSnapshot {
  return {};
}

export function assertStagingSupabaseUrl(supabaseUrl: string) {
  const url = String(supabaseUrl ?? "");
  if (!url) {
    throw new Error("SUPABASE_URL is required for anon SELECT readBack");
  }
  if (url.includes(PRODUCTION_REF_STOP)) {
    throw new Error("production Supabase ref is blocked for readBack");
  }
  if (!url.includes(STAGING_PROJECT_REF)) {
    throw new Error("readBack anon SELECT is staging-only");
  }
}

export function buildAnonSelectDiscographyReleasePath(siteSlug: string, legacyId: string): string {
  const slug = encodeURIComponent(String(siteSlug ?? "").trim());
  const legacy = encodeURIComponent(String(legacyId ?? "").trim());
  return `/rest/v1/discography?site_slug=eq.${slug}&legacy_id=eq.${legacy}&select=${RELEASE_SELECT_FIELDS}&limit=1`;
}

export function buildAnonSelectDiscographyTracksPath(siteSlug: string, legacyId: string): string {
  const slug = encodeURIComponent(String(siteSlug ?? "").trim());
  const legacy = encodeURIComponent(String(legacyId ?? "").trim());
  return `/rest/v1/discography_tracks?site_slug=eq.${slug}&discography_legacy_id=eq.${legacy}&select=${TRACK_SELECT_FIELDS}&order=track_number.asc.nullslast,sort_order.asc.nullslast`;
}

export function sortTrackRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return [...(rows ?? [])].sort((a, b) => {
    const trackA = Number(a?.track_number ?? 0);
    const trackB = Number(b?.track_number ?? 0);
    if (trackA !== trackB) return trackA - trackB;
    const sortA = Number(a?.sort_order ?? 0);
    const sortB = Number(b?.sort_order ?? 0);
    return sortA - sortB;
  });
}

export function mapTrackRowsToTracksText(rows: Array<Record<string, unknown>>): string {
  return sortTrackRows(rows)
    .map((row) => String(row?.title ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

export function mapReleaseRowToCurrentSnapshotRelease(row: Record<string, unknown>): Record<string, unknown> {
  return {
    title: row?.title ?? null,
    artist: row?.artist ?? null,
    release_date: row?.release_date ?? null,
    label: row?.label ?? null,
    catalog_number: row?.catalog_number ?? null,
    published: row?.published ?? null,
    cover_image_url: row?.cover_image_url ?? null,
    purchase_url: row?.purchase_url ?? null,
    streaming_url: row?.streaming_url ?? null,
    description: row?.description ?? null,
  };
}

export function buildSanitizedReadBackSummary(input: {
  legacyId: string;
  siteSlug?: string;
  releaseFound: boolean;
  trackCount: number;
  enabled?: boolean;
}): SanitizedReadBackSummary {
  return {
    enabled: input.enabled !== false,
    source: READBACK_SOURCE,
    releaseFound: Boolean(input.releaseFound),
    trackCount: Number(input.trackCount ?? 0),
    legacyId: String(input.legacyId ?? ""),
    siteSlug: String(input.siteSlug ?? SITE_SLUG),
  };
}

export function snapshotFromReadBackRows(
  releaseRow: Record<string, unknown> | null | undefined,
  trackRows: Array<Record<string, unknown>>,
  meta: { legacyId: string; siteSlug?: string },
): { snapshot: CurrentSnapshot; summary: SanitizedReadBackSummary } {
  const legacyId = String(meta?.legacyId ?? "");
  const siteSlug = String(meta?.siteSlug ?? SITE_SLUG);
  const sortedTracks = sortTrackRows(trackRows ?? []);

  if (!releaseRow) {
    return {
      snapshot: {},
      summary: buildSanitizedReadBackSummary({
        legacyId,
        siteSlug,
        releaseFound: false,
        trackCount: 0,
        enabled: true,
      }),
    };
  }

  return {
    snapshot: {
      tracksText: mapTrackRowsToTracksText(sortedTracks),
      release: mapReleaseRowToCurrentSnapshotRelease(releaseRow),
    },
    summary: buildSanitizedReadBackSummary({
      legacyId,
      siteSlug,
      releaseFound: true,
      trackCount: sortedTracks.length,
      enabled: true,
    }),
  };
}

export async function resolveReadBackSnapshot(
  adapter: ReadBackQueryAdapter,
  input: { siteSlug: string; legacyId: string },
): Promise<{ snapshot: CurrentSnapshot; summary: SanitizedReadBackSummary; warnings: string[] }> {
  const siteSlug = String(input?.siteSlug ?? SITE_SLUG);
  const legacyId = String(input?.legacyId ?? "").trim();
  const warnings: string[] = [];
  const releaseRow = await adapter.fetchRelease({ siteSlug, legacyId });
  if (!releaseRow) {
    return { ...snapshotFromReadBackRows(null, [], { legacyId, siteSlug }), warnings };
  }
  let trackRows: Array<Record<string, unknown>> = [];
  try {
    trackRows = await adapter.fetchTracks({ siteSlug, legacyId });
  } catch (error) {
    warnings.push(
      `readBack: anon SELECT tracks failed (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  return { ...snapshotFromReadBackRows(releaseRow, trackRows, { legacyId, siteSlug }), warnings };
}

export function createAnonSelectReadBackAdapter(deps: {
  fetchFn: typeof fetch;
  supabaseUrl: string;
  anonKey: string;
}): ReadBackQueryAdapter {
  const fetchFn = deps.fetchFn;
  const supabaseUrl = String(deps.supabaseUrl ?? "").replace(/\/+$/, "");
  const anonKey = String(deps.anonKey ?? "");
  assertStagingSupabaseUrl(supabaseUrl);
  if (!anonKey) {
    throw new Error("SUPABASE_ANON_KEY is required for anon SELECT readBack");
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };

  return {
    async fetchRelease({ siteSlug, legacyId }) {
      const path = buildAnonSelectDiscographyReleasePath(siteSlug, legacyId);
      const response = await fetchFn(`${supabaseUrl}${path}`, { method: "GET", headers });
      if (!response.ok) {
        throw new Error(`anon SELECT release failed (${response.status})`);
      }
      const rows = await response.json();
      return Array.isArray(rows) && rows.length > 0 ? (rows[0] as Record<string, unknown>) : null;
    },
    async fetchTracks({ siteSlug, legacyId }) {
      const path = buildAnonSelectDiscographyTracksPath(siteSlug, legacyId);
      const response = await fetchFn(`${supabaseUrl}${path}`, { method: "GET", headers });
      if (!response.ok) {
        throw new Error(`anon SELECT tracks failed (${response.status})`);
      }
      const rows = await response.json();
      return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
    },
  };
}

export function createDefaultAnonSelectReadBackAdapter(env: {
  fetch?: typeof fetch;
  supabaseUrl?: string;
  anonKey?: string;
} = {}): ReadBackQueryAdapter {
  const fetchFn = env.fetch ?? globalThis.fetch.bind(globalThis);
  const supabaseUrl = env.supabaseUrl ?? "";
  const anonKey = env.anonKey ?? "";
  return createAnonSelectReadBackAdapter({ fetchFn, supabaseUrl, anonKey });
}

export function parseDiscographyTrackListLines(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findDuplicateTitles(lines: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const line of lines) {
    if (seen.has(line)) {
      if (!dupes.includes(line)) dupes.push(line);
    } else {
      seen.add(line);
    }
  }
  return dupes;
}

function diffReleaseFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const changed: string[] = [];
  for (const field of RELEASE_FIELDS) {
    const b = before?.[field] ?? null;
    const a = after?.[field] ?? null;
    if (String(b ?? "") !== String(a ?? "")) changed.push(field);
  }
  return changed;
}

function validateDiscographyTrackListDryRun(
  originalText: string,
  nextText: string,
  meta: { legacyId?: string; title?: string } = {},
) {
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
  const changedLines: Array<{ line: number; before: string | null; after: string | null; kind: string }> = [];
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

function assertNoServiceRoleInPayload(payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  if (/service_role/i.test(serialized)) {
    return ["service_role must not appear in Save request/response payload exposed to browser"];
  }
  return [];
}

function validateReleaseObject(release: Record<string, unknown>) {
  const errors: string[] = [];
  if (!release || typeof release !== "object") {
    return ["release must be an object"];
  }
  if (typeof release.title !== "string" || !release.title.trim()) {
    errors.push("release.title must be a non-empty string");
  }
  if (typeof release.artist !== "string" || !release.artist.trim()) {
    errors.push("release.artist must be a non-empty string");
  }
  if (typeof release.published !== "boolean") {
    errors.push("release.published must be boolean");
  }
  return errors;
}

function validateTrackPolicy(trackPolicy: Record<string, unknown>) {
  const errors: string[] = [];
  if (!trackPolicy || typeof trackPolicy !== "object") {
    return ["trackPolicy must be an object"];
  }
  if (trackPolicy.oneLineOneTrack !== true) errors.push("trackPolicy.oneLineOneTrack must be true");
  if (trackPolicy.blankLinesIgnored !== true) errors.push("trackPolicy.blankLinesIgnored must be true");
  if (typeof trackPolicy.allowDuplicateTitles !== "boolean") {
    errors.push("trackPolicy.allowDuplicateTitles must be boolean");
  }
  if (typeof trackPolicy.allowEmptyTrackList !== "boolean") {
    errors.push("trackPolicy.allowEmptyTrackList must be boolean");
  }
  return errors;
}

function validateClientDryRun(clientDryRun: Record<string, unknown>) {
  const errors: string[] = [];
  if (!clientDryRun || typeof clientDryRun !== "object") {
    return ["clientDryRun must be an object"];
  }
  if (clientDryRun.wouldWrite !== false) {
    errors.push("clientDryRun.wouldWrite must be false (browser never writes)");
  }
  return errors;
}

function validateDryRunRequest(request: DryRunRequest) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request || typeof request !== "object") {
    return { ok: false, errors: ["request must be an object"], warnings: [] };
  }

  if (request.operation === "save") {
    errors.push('operation "save" is rejected by dry-run endpoint — use dryRun only');
    return { ok: false, errors, warnings };
  }

  if (request.operation !== DRY_RUN_OPERATION) {
    errors.push(`operation must be "${DRY_RUN_OPERATION}"`);
  }

  const siteSlug = String(request.siteSlug ?? "").trim();
  if (siteSlug !== SITE_SLUG) {
    errors.push(`Save is staging-only; siteSlug must be "${SITE_SLUG}"`);
  }

  const legacyId = String(request.legacyId ?? "").trim();
  if (!legacyId) errors.push("legacyId is required");

  const approvalId = String(request.approvalId ?? "").trim();
  if (!approvalId) {
    errors.push("approvalId is required");
  } else {
    const entry = lookupApprovalEntry(approvalId);
    if (entry?.operation === "save") {
      errors.push("save approval ID is not accepted on dry-run endpoint");
    }
    if (entry && entry.operation !== DRY_RUN_OPERATION) {
      errors.push(`approvalId ${approvalId} is registered for operation "${entry.operation}", not "${DRY_RUN_OPERATION}"`);
    }
  }

  errors.push(...assertNoServiceRoleInPayload(request));

  const release = (request.release ?? {}) as Record<string, unknown>;
  errors.push(...validateReleaseObject(release));

  if (typeof request.tracksText !== "string") {
    errors.push("tracksText must be a string");
  } else {
    const trackPolicy = (request.trackPolicy ?? {}) as Record<string, unknown>;
    errors.push(...validateTrackPolicy(trackPolicy));
    const lines = parseDiscographyTrackListLines(request.tracksText);
    if (lines.length === 0 && trackPolicy.allowEmptyTrackList !== true) {
      errors.push("empty track list blocked (trackPolicy.allowEmptyTrackList must be true to override)");
    }
    const dupes = findDuplicateTitles(lines);
    if (dupes.length > 0) warnings.push(`duplicate track titles: ${dupes.join(", ")}`);
  }

  const clientDryRun = (request.clientDryRun ?? {}) as Record<string, unknown>;
  errors.push(...validateClientDryRun(clientDryRun));

  return { ok: errors.length === 0, errors, warnings };
}

export function buildDryRunEndpointResponse(input: {
  ok: boolean;
  legacyId: string;
  approvalId: string;
  wouldWrite: boolean;
  diff: Record<string, unknown>;
  changedCounts: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
  serverTime?: string;
  readBack?: SanitizedReadBackSummary | null;
}) {
  return {
    ok: input.ok,
    operation: DRY_RUN_OPERATION,
    endpoint: ENDPOINT_NAME,
    siteSlug: SITE_SLUG,
    legacyId: input.legacyId,
    approvalId: input.approvalId,
    wouldWrite: input.wouldWrite,
    ...WRITE_FLAGS,
    changedCounts: input.changedCounts,
    diff: input.diff,
    backupToken: null,
    backupPreview: null,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
    readBack: input.readBack ?? null,
    serverTime: input.serverTime ?? new Date().toISOString(),
  };
}

function buildRejectionResponse(input: {
  legacyId?: string;
  approvalId?: string;
  errors: string[];
  warnings?: string[];
  status?: number;
}) {
  return {
    ...buildDryRunEndpointResponse({
      ok: false,
      legacyId: String(input.legacyId ?? ""),
      approvalId: String(input.approvalId ?? ""),
      wouldWrite: false,
      diff: {},
      changedCounts: {},
      errors: input.errors,
      warnings: input.warnings ?? [],
    }),
    status: input.status ?? 400,
    approvalRequirements: getDryRunApprovalRequirements(),
  };
}

export function simulateDiscographySaveDryRunEndpoint(
  request: DryRunRequest,
  currentSnapshot: CurrentSnapshot = {},
  options: { readBack?: SanitizedReadBackSummary | null } = {},
) {
  const validation = validateDryRunRequest(request);
  const legacyId = String(request?.legacyId ?? "");
  const approvalId = String(request?.approvalId ?? "");

  if (!validation.ok) {
    return {
      ...buildDryRunEndpointResponse({
        ok: false,
        legacyId,
        approvalId,
        wouldWrite: false,
        diff: {},
        changedCounts: {},
        errors: validation.errors,
        warnings: validation.warnings,
        readBack: options.readBack ?? null,
      }),
      status: 400,
      approvalRequirements: getDryRunApprovalRequirements(),
    };
  }

  const warnings = [...validation.warnings];
  const tracksText = String(request.tracksText ?? "");
  const release = (request.release ?? {}) as Record<string, unknown>;
  const trackPolicy = (request.trackPolicy ?? {
    allowDuplicateTitles: true,
    allowEmptyTrackList: false,
  }) as Record<string, unknown>;

  const beforeText = String(currentSnapshot.tracksText ?? "");
  const trackDiff = validateDiscographyTrackListDryRun(beforeText, tracksText, {
    legacyId,
    title: String(release.title ?? ""),
  });

  const afterLines = parseDiscographyTrackListLines(tracksText);
  if (afterLines.length === 0 && trackPolicy.allowEmptyTrackList !== true) {
    return {
      ...buildDryRunEndpointResponse({
        ok: false,
        legacyId,
        approvalId,
        wouldWrite: false,
        diff: trackDiff,
        changedCounts: {
          releaseFields: [],
          tracksAdded: 0,
          tracksRemoved: 0,
          tracksReordered: false,
        },
        errors: ["empty track list blocked (allowEmptyTrackList must be true to override)"],
        warnings,
        readBack: options.readBack ?? null,
      }),
      status: 400,
      approvalRequirements: getDryRunApprovalRequirements(),
    };
  }

  const currentRelease = (currentSnapshot.release ?? {}) as Record<string, unknown>;
  const releaseFieldsChanged = diffReleaseFields(currentRelease, release);
  const tracksChanged =
    trackDiff.added.length > 0 ||
    trackDiff.removed.length > 0 ||
    trackDiff.reordered ||
    trackDiff.changedLines.length > 0;

  const hasCurrentBaseline = Boolean(currentSnapshot.tracksText != null || currentSnapshot.release);
  const wouldWrite = hasCurrentBaseline
    ? tracksChanged || releaseFieldsChanged.length > 0
    : afterLines.length > 0 || releaseFieldsChanged.length > 0;

  return {
    ...buildDryRunEndpointResponse({
      ok: true,
      legacyId,
      approvalId,
      wouldWrite,
      diff: {
        totalBefore: trackDiff.totalBefore,
        totalAfter: trackDiff.totalAfter,
        added: trackDiff.added,
        removed: trackDiff.removed,
        unchanged: trackDiff.unchanged,
        changedLines: trackDiff.changedLines,
        reordered: trackDiff.reordered,
        releaseFieldsChanged,
      },
      changedCounts: {
        releaseFields: releaseFieldsChanged,
        tracksAdded: trackDiff.added.length,
        tracksRemoved: trackDiff.removed.length,
        tracksReordered: trackDiff.reordered,
      },
      errors: [],
      warnings,
      readBack: options.readBack ?? null,
    }),
    status: 200,
  };
}

export async function simulateDiscographySaveDryRunEndpointWithReadBack(
  request: DryRunRequest,
  adapter: ReadBackQueryAdapter | null,
  options: { readBackEnabled?: boolean } = {},
): Promise<DryRunHandlerResult> {
  const readBackEnabled = options.readBackEnabled !== false && adapter != null;
  let currentSnapshot: CurrentSnapshot = {};
  let readBackSummary: SanitizedReadBackSummary | null = null;
  const readBackWarnings: string[] = [];

  if (readBackEnabled && adapter) {
    try {
      const readBack = await resolveReadBackSnapshot(adapter, {
        siteSlug: SITE_SLUG,
        legacyId: String(request.legacyId ?? ""),
      });
      currentSnapshot = readBack.snapshot;
      readBackSummary = readBack.summary;
      readBackWarnings.push(...readBack.warnings);
      if (!readBack.summary.releaseFound) {
        readBackWarnings.push("readBack: release not found in database");
      }
    } catch (error) {
      readBackWarnings.push(
        `readBack: anon SELECT failed (${error instanceof Error ? error.message : String(error)})`,
      );
      readBackSummary = buildSanitizedReadBackSummary({
        legacyId: String(request.legacyId ?? ""),
        siteSlug: SITE_SLUG,
        releaseFound: false,
        trackCount: 0,
        enabled: true,
      });
    }
  }

  const result = simulateDiscographySaveDryRunEndpoint(request, currentSnapshot, {
    readBack: readBackSummary,
  });
  const mergedWarnings = [...(Array.isArray(result.warnings) ? result.warnings : []), ...readBackWarnings];
  return {
    ...result,
    warnings: mergedWarnings,
    readBack: readBackSummary,
  } as DryRunHandlerResult;
}

export function validateHttpEnvelope(input: {
  method?: string;
  contentType?: string;
  body?: unknown;
}) {
  const errors: string[] = [];
  const method = String(input.method ?? "").toUpperCase();
  const contentType = String(input.contentType ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (method !== "POST") errors.push("HTTP method must be POST");
  if (contentType !== "application/json") errors.push("Content-Type must be application/json");
  if (input.body != null && (typeof input.body !== "object" || Array.isArray(input.body))) {
    errors.push("request body must be a JSON object");
  }

  let status = 200;
  if (errors.length > 0) {
    status = method !== "POST" ? 405 : 415;
  }

  return { ok: errors.length === 0, errors, status };
}

const CONTROLLED_TRACK_SELECT =
  "id,track_number,title,sort_order,site_slug,discography_legacy_id";

function buildControlledSaveFailure(input: {
  reasonCode: string;
  message: string;
  status: number;
  legacyId?: string;
  approvalId?: string;
  sliceId?: string;
}): DryRunHandlerResult {
  return {
    ok: false,
    operation: CONTROLLED_SAVE_OPERATION,
    controlledSave: true,
    endpoint: ENDPOINT_NAME,
    siteSlug: SITE_SLUG,
    legacyId: String(input.legacyId ?? ""),
    approvalId: String(input.approvalId ?? ""),
    sliceId: String(input.sliceId ?? ""),
    reasonCode: input.reasonCode,
    errors: [input.message],
    warnings: [],
    wouldWrite: false,
    ...WRITE_FLAGS,
    saveEnabled: false,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    updatedRows: 0,
    status: input.status,
    serverTime: new Date().toISOString(),
  };
}

/** Strip Bearer prefix · never log the raw token. */
export function extractBearerToken(authorizationHeader: string | null | undefined): string | null {
  const raw = String(authorizationHeader ?? "").trim();
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  const token = match?.[1]?.trim() ?? "";
  return token.length > 0 ? token : null;
}

export function createUserJwtSupabaseClient(input: {
  supabaseUrl: string;
  anonKey: string;
  authorizationHeader: string;
}): SupabaseClient {
  const supabaseUrl = String(input.supabaseUrl ?? "").replace(/\/+$/, "");
  const anonKey = String(input.anonKey ?? "");
  const authorizationHeader = String(input.authorizationHeader ?? "").trim();
  assertStagingSupabaseUrl(supabaseUrl);
  if (!anonKey) {
    throw new Error("SUPABASE_ANON_KEY is required for controlled Save");
  }
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authorization Bearer token is required for controlled Save");
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorizationHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function assertOperatorIsAdmin(
  client: SupabaseClient,
): Promise<{ ok: true } | { ok: false; reasonCode: string; status: number; message: string }> {
  const { data, error } = await client.rpc("is_admin");
  if (error) {
    const msg = String(error.message ?? "");
    if (/jwt|token|auth/i.test(msg)) {
      return {
        ok: false,
        reasonCode: "invalid_jwt",
        status: 401,
        message: "Invalid or expired Authorization",
      };
    }
    return {
      ok: false,
      reasonCode: "admin_probe_failed",
      status: 403,
      message: "Admin probe failed",
    };
  }
  if (data !== true) {
    return {
      ok: false,
      reasonCode: "admin_required",
      status: 403,
      message: "public.is_admin() must be true",
    };
  }
  return { ok: true };
}

function resolveControlledLegacyId(request: DryRunRequest): string {
  return String(request.discographyLegacyId ?? request.legacyId ?? "").trim();
}

function resolveControlledAfterTitle(
  request: DryRunRequest,
  slice: ControlledSaveSliceSpec,
): string {
  const explicit = String(request.afterTitle ?? request.requestedTitle ?? "").trim();
  if (explicit) return explicit;
  if (typeof request.tracksText === "string") {
    const lines = parseDiscographyTrackListLines(request.tracksText);
    return lines[0] ?? "";
  }
  return slice.afterTitle;
}

export function resolveControlledSaveSlice(request: DryRunRequest): {
  ok: boolean;
  reasonCode?: string;
  message?: string;
  slice?: ControlledSaveSliceSpec;
  legacyId: string;
  approvalId: string;
  sliceId: string;
  targetRowId: string;
  beforeTitle: string;
  afterTitle: string;
} {
  const legacyId = resolveControlledLegacyId(request);
  const approvalId = String(request.approvalId ?? "").trim();
  const sliceId = String(request.sliceId ?? "").trim();
  const siteSlug = String(request.siteSlug ?? "").trim();
  const targetRowId = String(request.targetRowId ?? request.trackTargetId ?? "").trim();
  const trackNumber = Number(request.trackNumber ?? NaN);
  const requestBeforeTitle = String(request.beforeTitle ?? "").trim();

  if (String(request.operation ?? "") !== CONTROLLED_SAVE_OPERATION) {
    return {
      ok: false,
      reasonCode: "operation_mismatch",
      message: 'operation must be "save" for controlled Save',
      legacyId,
      approvalId,
      sliceId,
      targetRowId,
      beforeTitle: requestBeforeTitle,
      afterTitle: "",
    };
  }

  const candidate = CONTROLLED_SAVE_SLICE_ALLOWLIST.find(
    (entry) =>
      entry.approvalId === approvalId &&
      entry.sliceId === sliceId &&
      entry.siteSlug === siteSlug &&
      entry.legacyId === legacyId &&
      entry.targetRowId === targetRowId &&
      entry.trackNumber === trackNumber,
  );

  if (!candidate) {
    const reasonCode =
      approvalId && !CONTROLLED_SAVE_SLICE_ALLOWLIST.some((e) => e.approvalId === approvalId)
        ? "approval_id_mismatch"
        : sliceId && !CONTROLLED_SAVE_SLICE_ALLOWLIST.some((e) => e.sliceId === sliceId)
          ? "slice_id_mismatch"
          : siteSlug !== SITE_SLUG
            ? "site_mismatch"
            : legacyId !== CONTROLLED_SAVE_LEGACY_ID
              ? "discography_mismatch"
              : targetRowId !== CONTROLLED_SAVE_TARGET_ROW_ID
                ? "row_id_mismatch"
                : trackNumber !== CONTROLLED_SAVE_TRACK_NUMBER
                  ? "track_number_mismatch"
                  : "controlled_slice_not_allowlisted";
    return {
      ok: false,
      reasonCode,
      message: "controlled Save slice not allowlisted — broad Save is forbidden",
      legacyId,
      approvalId,
      sliceId,
      targetRowId,
      beforeTitle: requestBeforeTitle,
      afterTitle: "",
    };
  }

  const resolvedBefore = requestBeforeTitle || candidate.beforeTitle;
  const resolvedAfter = resolveControlledAfterTitle(request, candidate);

  if (resolvedBefore !== candidate.beforeTitle) {
    return {
      ok: false,
      reasonCode: "before_title_mismatch",
      message: "beforeTitle must match allowlisted slice exactly",
      legacyId,
      approvalId,
      sliceId,
      targetRowId,
      beforeTitle: resolvedBefore,
      afterTitle: resolvedAfter,
    };
  }
  if (resolvedAfter !== candidate.afterTitle) {
    return {
      ok: false,
      reasonCode: "requested_title_mismatch",
      message: "afterTitle must match allowlisted slice exactly",
      legacyId,
      approvalId,
      sliceId,
      targetRowId,
      beforeTitle: resolvedBefore,
      afterTitle: resolvedAfter,
    };
  }

  const serviceRoleErrors = assertNoServiceRoleInPayload(request);
  if (serviceRoleErrors.length > 0) {
    return {
      ok: false,
      reasonCode: "service_role_forbidden",
      message: serviceRoleErrors[0],
      legacyId,
      approvalId,
      sliceId,
      targetRowId,
      beforeTitle: resolvedBefore,
      afterTitle: resolvedAfter,
    };
  }

  return {
    ok: true,
    slice: candidate,
    legacyId,
    approvalId,
    sliceId,
    targetRowId,
    beforeTitle: resolvedBefore,
    afterTitle: resolvedAfter,
  };
}

/** @deprecated Use resolveControlledSaveSlice — kept for doc/verifier string references. */
export function validateControlledSaveGates(request: DryRunRequest) {
  return resolveControlledSaveSlice(request);
}

function validateControlledTracksTextAgainstDb(
  request: DryRunRequest,
  dbTitles: string[],
  slice: ControlledSaveSliceSpec,
): { ok: true } | { ok: false; reasonCode: string; message: string } {
  if (dbTitles.length !== slice.trackCount) {
    return {
      ok: false,
      reasonCode: "track_count_mismatch",
      message: `DB track_count must be ${slice.trackCount}`,
    };
  }
  if (dbTitles[0] !== slice.beforeTitle) {
    return {
      ok: false,
      reasonCode: "current_title_mismatch",
      message: "current track 1 title must match allowlisted beforeTitle",
    };
  }
  if (dbTitles[6] !== slice.track7Title) {
    return {
      ok: false,
      reasonCode: "track_7_mismatch",
      message: "track 7 must remain Like a Lover",
    };
  }

  if (typeof request.tracksText === "string") {
    const afterLines = parseDiscographyTrackListLines(request.tracksText);
    if (afterLines.length !== slice.trackCount) {
      return {
        ok: false,
        reasonCode: "track_count_mismatch",
        message: `tracksText must contain exactly ${slice.trackCount} tracks`,
      };
    }
    const trackDiff = validateDiscographyTrackListDryRun(dbTitles.join("\n"), afterLines.join("\n"));
    if (trackDiff.added.length > 0 || trackDiff.removed.length > 0) {
      return {
        ok: false,
        reasonCode: "add_or_delete_forbidden",
        message: "track add/delete is forbidden for controlled Save",
      };
    }
    if (trackDiff.reordered) {
      return {
        ok: false,
        reasonCode: "reorder_forbidden",
        message: "track reorder is forbidden for controlled Save",
      };
    }
    if (trackDiff.changedLines.length !== 1) {
      return {
        ok: false,
        reasonCode: "changed_lines_mismatch",
        message: "controlled Save allows exactly one changed title line",
      };
    }
    const only = trackDiff.changedLines[0];
    if (only.line !== 1 || only.kind !== "changed") {
      return {
        ok: false,
        reasonCode: "changed_field_forbidden",
        message: "only track 1 title may change",
      };
    }
    if (only.before !== slice.beforeTitle || only.after !== slice.afterTitle) {
      return {
        ok: false,
        reasonCode: "requested_title_mismatch",
        message: "changed title must match allowlisted before/after strings",
      };
    }
    if (afterLines[6] !== slice.track7Title) {
      return {
        ok: false,
        reasonCode: "track_7_mismatch",
        message: "track 7 must remain Like a Lover",
      };
    }
  }

  return { ok: true };
}

/**
 * Controlled Save — user JWT + is_admin + RLS + title-only single-row UPDATE.
 * Allowlisted slices only (G-20u36e forward · G-20u36f restore). Never logs Authorization / JWT.
 */
export async function handleControlledG20u36eSaveHttp(input: {
  request: DryRunRequest;
  authorizationHeader?: string | null;
  supabaseUrl?: string;
  anonKey?: string;
}): Promise<DryRunHandlerResult> {
  const gates = resolveControlledSaveSlice(input.request);
  if (!gates.ok || !gates.slice) {
    return buildControlledSaveFailure({
      reasonCode: gates.reasonCode ?? "controlled_gate_failed",
      message: gates.message ?? "controlled Save gate failed",
      status: 400,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const slice = gates.slice;

  const bearer = extractBearerToken(input.authorizationHeader);
  if (!bearer) {
    return buildControlledSaveFailure({
      reasonCode: "missing_authorization",
      message: "Authorization Bearer token is required",
      status: 401,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const authorizationHeader = `Bearer ${bearer}`;
  let client: SupabaseClient;
  try {
    client = createUserJwtSupabaseClient({
      supabaseUrl: input.supabaseUrl ?? "",
      anonKey: input.anonKey ?? "",
      authorizationHeader,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const production = /production/i.test(message);
    return buildControlledSaveFailure({
      reasonCode: production ? "production_ref_blocked" : "config_error",
      message: production ? "production Supabase ref is blocked" : "controlled Save config error",
      status: production ? 403 : 500,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const admin = await assertOperatorIsAdmin(client);
  if (!admin.ok) {
    return buildControlledSaveFailure({
      reasonCode: admin.reasonCode,
      message: admin.message,
      status: admin.status,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const { data: trackRows, error: tracksError } = await client
    .from("discography_tracks")
    .select(CONTROLLED_TRACK_SELECT)
    .eq("site_slug", slice.siteSlug)
    .eq("discography_legacy_id", slice.legacyId)
    .order("track_number", { ascending: true });

  if (tracksError) {
    return buildControlledSaveFailure({
      reasonCode: "rls_or_permission_denied",
      message: "failed to read tracks for controlled Save",
      status: 403,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const sorted = sortTrackRows((trackRows ?? []) as Array<Record<string, unknown>>);
  const dbTitles = sorted.map((row) => String(row.title ?? "").trim());
  const targetRow = sorted.find((row) => String(row.id ?? "") === slice.targetRowId);
  if (!targetRow) {
    return buildControlledSaveFailure({
      reasonCode: "row_id_mismatch",
      message: "target row id not found in discography-002 tracks",
      status: 409,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }
  if (Number(targetRow.track_number) !== slice.trackNumber) {
    return buildControlledSaveFailure({
      reasonCode: "track_number_mismatch",
      message: "target row track_number must match allowlisted slice",
      status: 409,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const tracksOk = validateControlledTracksTextAgainstDb(input.request, dbTitles, slice);
  if (!tracksOk.ok) {
    return buildControlledSaveFailure({
      reasonCode: tracksOk.reasonCode,
      message: tracksOk.message,
      status: 409,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  if (input.request.release && typeof input.request.release === "object") {
    const { data: releaseRow, error: releaseError } = await client
      .from("discography")
      .select(RELEASE_SELECT_FIELDS)
      .eq("site_slug", slice.siteSlug)
      .eq("legacy_id", slice.legacyId)
      .limit(1)
      .maybeSingle();
    if (releaseError || !releaseRow) {
      return buildControlledSaveFailure({
        reasonCode: "release_read_failed",
        message: "failed to read release for scalar comparison",
        status: 403,
        legacyId: gates.legacyId,
        approvalId: gates.approvalId,
        sliceId: gates.sliceId,
      });
    }
    const currentRelease = mapReleaseRowToCurrentSnapshotRelease(releaseRow as Record<string, unknown>);
    const releaseFieldsChanged = diffReleaseFields(
      currentRelease,
      input.request.release as Record<string, unknown>,
    );
    if (releaseFieldsChanged.length > 0) {
      return buildControlledSaveFailure({
        reasonCode: "release_scalar_change_forbidden",
        message: "release scalar changes are forbidden for controlled Save",
        status: 400,
        legacyId: gates.legacyId,
        approvalId: gates.approvalId,
        sliceId: gates.sliceId,
      });
    }
  }

  // Title-only payload — no updated_at / sort_order / other columns · no discography table write.
  const { data: updatedRows, error: updateError } = await client
    .from("discography_tracks")
    .update({ title: slice.afterTitle })
    .eq("site_slug", slice.siteSlug)
    .eq("discography_legacy_id", slice.legacyId)
    .eq("track_number", slice.trackNumber)
    .eq("id", slice.targetRowId)
    .eq("title", slice.beforeTitle)
    .select("id,title,track_number");

  if (updateError) {
    return buildControlledSaveFailure({
      reasonCode: "rls_or_permission_denied",
      message: "controlled Save UPDATE denied by RLS or grants",
      status: 403,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const updatedCount = Array.isArray(updatedRows) ? updatedRows.length : 0;
  if (updatedCount === 0) {
    return buildControlledSaveFailure({
      reasonCode: "update_zero_rows",
      message: "UPDATE matched 0 rows — conflict / already changed / STOP",
      status: 409,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }
  if (updatedCount !== 1) {
    return buildControlledSaveFailure({
      reasonCode: "update_multiple_rows",
      message: "UPDATE matched multiple rows — STOP",
      status: 500,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const { data: postTracks, error: postTracksError } = await client
    .from("discography_tracks")
    .select(CONTROLLED_TRACK_SELECT)
    .eq("site_slug", slice.siteSlug)
    .eq("discography_legacy_id", slice.legacyId)
    .order("track_number", { ascending: true });

  if (postTracksError) {
    return buildControlledSaveFailure({
      reasonCode: "post_save_readback_failed",
      message: "UPDATE succeeded but post-save readBack failed",
      status: 500,
      legacyId: gates.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
    });
  }

  const postSorted = sortTrackRows((postTracks ?? []) as Array<Record<string, unknown>>);
  const postTitles = postSorted.map((row) => String(row.title ?? "").trim());
  const postTrack1 = postTitles[0] ?? "";
  const postTrack7 = postTitles[6] ?? "";
  const readBackSummary = {
    enabled: true,
    source: "user-jwt-select",
    releaseFound: true,
    trackCount: postTitles.length,
    track_7_title: postTrack7,
    targetTitle: postTrack1,
    targetRowCount: postSorted.filter((row) => String(row.id ?? "") === slice.targetRowId)
      .length,
    legacyId: slice.legacyId,
    siteSlug: slice.siteSlug,
    noAddedRemoved:
      postTitles.length === slice.trackCount && postTrack7 === slice.track7Title,
  };

  if (
    postTrack1 !== slice.afterTitle ||
    postTitles.length !== slice.trackCount ||
    postTrack7 !== slice.track7Title ||
    readBackSummary.targetRowCount !== 1
  ) {
    return {
      ok: false,
      operation: CONTROLLED_SAVE_OPERATION,
      controlledSave: true,
      endpoint: ENDPOINT_NAME,
      siteSlug: slice.siteSlug,
      discographyLegacyId: slice.legacyId,
      legacyId: slice.legacyId,
      approvalId: gates.approvalId,
      sliceId: gates.sliceId,
      trackNumber: slice.trackNumber,
      beforeTitle: slice.beforeTitle,
      afterTitle: slice.afterTitle,
      updatedRows: 1,
      reasonCode: "post_save_verification_failed",
      errors: ["post-save readBack did not match controlled expectations"],
      warnings: [],
      readBack: readBackSummary,
      wouldWrite: true,
      didWrite: true,
      dbWrite: true,
      networkWrite: true,
      saveEnabled: true,
      status: 500,
      serverTime: new Date().toISOString(),
    };
  }

  return {
    ok: true,
    operation: CONTROLLED_SAVE_OPERATION,
    controlledSave: true,
    endpoint: ENDPOINT_NAME,
    siteSlug: slice.siteSlug,
    discographyLegacyId: slice.legacyId,
    legacyId: slice.legacyId,
    approvalId: gates.approvalId,
    sliceId: gates.sliceId,
    trackNumber: slice.trackNumber,
    beforeTitle: slice.beforeTitle,
    afterTitle: slice.afterTitle,
    updatedRows: 1,
    errors: [],
    warnings: [],
    readBack: readBackSummary,
    wouldWrite: true,
    didWrite: true,
    dbWrite: true,
    networkWrite: true,
    saveEnabled: true,
    status: 200,
    serverTime: new Date().toISOString(),
    phase: slice.phase,
  };
}

/**
 * HTTP handler entry — POST/json · dryRun (sync) · controlled save deferred to async path.
 * Sync path: schema-only baseline (readBack null) when readBack disabled.
 */
export function handleDiscographyEdgeDryRunHttp(input: {
  method?: string;
  contentType?: string;
  body?: unknown;
  authorizationHeader?: string | null;
}): DryRunHandlerResult {
  const envelope = validateHttpEnvelope(input);
  if (!envelope.ok) {
    return buildRejectionResponse({
      legacyId: "",
      approvalId: "",
      errors: envelope.errors,
      status: envelope.status,
    });
  }

  const request = (input.body ?? {}) as DryRunRequest;

  if (request.operation === CONTROLLED_SAVE_OPERATION) {
    return buildControlledSaveFailure({
      reasonCode: "controlled_save_requires_async",
      message:
        'operation "save" requires async controlled Save path (Authorization + user JWT)',
      status: 400,
      legacyId: resolveControlledLegacyId(request),
      approvalId: String(request.approvalId ?? ""),
      sliceId: String(request.sliceId ?? ""),
    });
  }

  const currentSnapshot = resolveCurrentSnapshot(String(request.legacyId ?? ""));
  const result = simulateDiscographySaveDryRunEndpoint(request, currentSnapshot);
  return result as DryRunHandlerResult;
}

/**
 * Async HTTP handler — dryRun (+ optional anon readBack) or allowlisted controlled Save.
 */
export async function handleDiscographyEdgeDryRunHttpAsync(
  input: {
    method?: string;
    contentType?: string;
    body?: unknown;
    authorizationHeader?: string | null;
  },
  options: {
    readBackEnabled?: boolean;
    readBackAdapter?: ReadBackQueryAdapter | null;
    supabaseUrl?: string;
    anonKey?: string;
  } = {},
): Promise<DryRunHandlerResult> {
  const envelope = validateHttpEnvelope(input);
  if (!envelope.ok) {
    return buildRejectionResponse({
      legacyId: "",
      approvalId: "",
      errors: envelope.errors,
      status: envelope.status,
    });
  }

  const request = (input.body ?? {}) as DryRunRequest;

  if (request.operation === CONTROLLED_SAVE_OPERATION) {
    return handleControlledG20u36eSaveHttp({
      request,
      authorizationHeader: input.authorizationHeader ?? null,
      supabaseUrl: options.supabaseUrl,
      anonKey: options.anonKey,
    });
  }

  const readBackEnabled = Boolean(options.readBackEnabled && options.readBackAdapter);
  if (readBackEnabled) {
    return simulateDiscographySaveDryRunEndpointWithReadBack(request, options.readBackAdapter ?? null, {
      readBackEnabled: true,
    });
  }

  const currentSnapshot = resolveCurrentSnapshot(String(request.legacyId ?? ""));
  const result = simulateDiscographySaveDryRunEndpoint(request, currentSnapshot);
  return result as DryRunHandlerResult;
}
