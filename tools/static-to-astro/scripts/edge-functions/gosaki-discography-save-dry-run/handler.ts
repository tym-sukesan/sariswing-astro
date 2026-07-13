/**
 * G-20u36b / G-20u36d — Gosaki Discography Edge dry-run endpoint handler (tools draft).
 * Ported from gosaki-discography-edge-dry-run-endpoint-inert.mjs + G-20u33 draft + G-20u36d readBack.
 * NOT deployed — tools/static-to-astro draft only · anon SELECT readBack · no service_role · no DB write.
 */

export const G20U36B_EDGE_FUNCTION_SOURCE_STAGING_PHASE =
  "G-20u36b-edge-dry-run-endpoint-function-source-staging";

export const G20U36D_READBACK_PHASE = "G-20u36d-readback-implementation-in-tools-draft";
export const G20U36D_RELEASE_ID_SELECT_FIX_PHASE = "G-20u36d-readback-release-id-select-fix-tools-draft";
export const G20U36D_TRACKS_SELECT_FIELDS_FIX_PHASE =
  "G-20u36d-readback-tracks-select-fields-fix-tools-draft";
export const G20U36D_TRACKS_RELATION_FILTER_FIX_PHASE =
  "G-20u36d-readback-tracks-relation-filter-fix-tools-draft";
export const READBACK_SOURCE = "supabase-select";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

export const ENDPOINT_NAME = "gosaki-discography-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const DRY_RUN_OPERATION = "dryRun";
export const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
export const SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";

/** Supabase service_role — NOT CONNECTED in function-source-staging phase. */
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

/**
 * HTTP handler entry — POST/json only · dryRun only · no service_role · no DB write.
 * Sync path: schema-only baseline (readBack null) when readBack disabled.
 */
export function handleDiscographyEdgeDryRunHttp(input: {
  method?: string;
  contentType?: string;
  body?: unknown;
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

  if (request.operation === "save") {
    return buildRejectionResponse({
      legacyId: String(request.legacyId ?? ""),
      approvalId: String(request.approvalId ?? ""),
      errors: ['operation "save" is rejected by dry-run endpoint — use dryRun only'],
      status: 400,
    });
  }

  const currentSnapshot = resolveCurrentSnapshot(String(request.legacyId ?? ""));
  const result = simulateDiscographySaveDryRunEndpoint(request, currentSnapshot);
  return result as DryRunHandlerResult;
}

/**
 * Async HTTP handler — optional anon SELECT readBack via injectable adapter.
 */
export async function handleDiscographyEdgeDryRunHttpAsync(
  input: {
    method?: string;
    contentType?: string;
    body?: unknown;
  },
  options: {
    readBackEnabled?: boolean;
    readBackAdapter?: ReadBackQueryAdapter | null;
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

  if (request.operation === "save") {
    return buildRejectionResponse({
      legacyId: String(request.legacyId ?? ""),
      approvalId: String(request.approvalId ?? ""),
      errors: ['operation "save" is rejected by dry-run endpoint — use dryRun only'],
      status: 400,
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
