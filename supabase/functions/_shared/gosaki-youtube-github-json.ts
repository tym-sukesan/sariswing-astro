/**
 * Gosaki YouTube embed JSON — GitHub Contents runtime source of truth.
 * Mirrors G-11c8 embedCode-only patch rules. No workflow_dispatch.
 */

import {
  getGithubContentsFile,
  updateGithubContentsFile,
  type GitHubContentsFile,
} from "./github.ts";

/** Local copy — avoid circular import with dry-run shared (same G-11c1 rules). */
function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const embedSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (embedSrc) {
    const fromEmbed = parseYoutubeVideoId(embedSrc);
    if (fromEmbed) return fromEmbed;
  }
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}

export const GOSAKI_YOUTUBE_GITHUB_BRANCH = "main";
export const GOSAKI_YOUTUBE_GITHUB_FILE_PATH =
  "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
export const GOSAKI_YOUTUBE_TARGET_ITEM_ID = "yt-placeholder-01";
export const GOSAKI_YOUTUBE_PATCH_FIELD = "embedCode";
export const GOSAKI_YOUTUBE_SITE_SLUG = "gosaki-piano";
export const GOSAKI_YOUTUBE_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const GOSAKI_YOUTUBE_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";

const FORBIDDEN_PATCH_FIELDS = ["published", "sortOrder", "sectionTitle", "id"] as const;

export type YoutubeEmbedSnapshot = {
  embedCode: string;
  videoId: string | null;
};

export type YoutubeSaveFingerprint = {
  branch: string;
  targetFilePath: string;
  targetItemId: string;
  githubFileSha: string;
  beforeEmbedCode: string;
  beforeVideoId: string | null;
  afterEmbedCode: string;
  afterVideoId: string | null;
};

export function assertGosakiYoutubeStagingSupabaseHost(): string | null {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  if (!url) return "SUPABASE_URL is not configured";
  if (url.includes(GOSAKI_YOUTUBE_PRODUCTION_PROJECT_REF)) {
    return "production Supabase project blocked";
  }
  if (!url.includes(GOSAKI_YOUTUBE_STAGING_PROJECT_REF)) {
    return `staging project ref ${GOSAKI_YOUTUBE_STAGING_PROJECT_REF} required`;
  }
  return null;
}

export function assertExactObjectKeys(
  body: unknown,
  allowed: readonly string[],
): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "request body must be a JSON object";
  }
  const keys = Object.keys(body as Record<string, unknown>).sort();
  const expected = [...allowed].sort();
  if (keys.length !== expected.length) {
    return `unexpected fields: allowed exact keys [${expected.join(", ")}]`;
  }
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] !== expected[i]) {
      return `unexpected fields: allowed exact keys [${expected.join(", ")}]`;
    }
  }
  return null;
}

function normalizeVideoId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return parseYoutubeVideoId(trimmed) ?? (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null);
}

export function findYoutubeTargetItems(config: unknown): unknown[] {
  if (!config || typeof config !== "object") return [];
  const items = (config as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      String((item as { id?: unknown }).id ?? "").trim() === GOSAKI_YOUTUBE_TARGET_ITEM_ID,
  );
}

export function readYoutubeTargetSnapshot(
  config: unknown,
):
  | { ok: true; snapshot: YoutubeEmbedSnapshot }
  | { ok: false; error: string; httpStatus: number } {
  if (!config || typeof config !== "object") {
    return { ok: false, error: "config must be a JSON object", httpStatus: 502 };
  }
  const root = config as Record<string, unknown>;
  if (String(root.siteSlug ?? "").trim() !== GOSAKI_YOUTUBE_SITE_SLUG) {
    return { ok: false, error: `config siteSlug must be ${GOSAKI_YOUTUBE_SITE_SLUG}`, httpStatus: 502 };
  }

  const matches = findYoutubeTargetItems(config);
  if (matches.length === 0) {
    return { ok: false, error: `target item ${GOSAKI_YOUTUBE_TARGET_ITEM_ID} not found`, httpStatus: 404 };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: `target item ${GOSAKI_YOUTUBE_TARGET_ITEM_ID} matched multiple rows`,
      httpStatus: 409,
    };
  }

  const item = matches[0] as Record<string, unknown>;
  const embedCode = String(item.embedCode ?? "").trim();
  const videoId = normalizeVideoId(item.videoId as string | null) ?? normalizeVideoId(embedCode);
  return { ok: true, snapshot: { embedCode, videoId } };
}

/**
 * embedCode-only patch — same rules as G-11c8 workflow patch helper.
 * Serializes with 2-space indent + trailing newline.
 */
export function planYoutubeEmbedCodePatch(input: {
  config: unknown;
  nextEmbedCode: string;
  expectedBeforeEmbedCode?: string;
  expectedBeforeVideoId?: string | null;
  enforceExpectedBefore?: boolean;
}):
  | {
      ok: true;
      saveReadiness: "changed" | "no_change";
      changedFields: string[];
      current: YoutubeEmbedSnapshot;
      next: YoutubeEmbedSnapshot;
      patchedContentText: string | null;
    }
  | { ok: false; error: string; httpStatus: number; current?: YoutubeEmbedSnapshot } {
  const currentRes = readYoutubeTargetSnapshot(input.config);
  if (!currentRes.ok) {
    return { ok: false, error: currentRes.error, httpStatus: currentRes.httpStatus };
  }
  const current = currentRes.snapshot;
  const nextEmbedCode = String(input.nextEmbedCode ?? "").trim();
  const nextVideoId = normalizeVideoId(nextEmbedCode);
  if (!nextVideoId) {
    return { ok: false, error: "nextValue videoId extraction failed", httpStatus: 422 };
  }

  if (input.enforceExpectedBefore !== false) {
    const expectedEmbed = String(input.expectedBeforeEmbedCode ?? "").trim();
    if (expectedEmbed !== current.embedCode) {
      return {
        ok: false,
        error: "expectedBefore.embedCode does not match current embedCode",
        httpStatus: 409,
        current,
      };
    }
    const expectedVid = normalizeVideoId(input.expectedBeforeVideoId);
    if (expectedVid !== current.videoId) {
      return {
        ok: false,
        error: "expectedBefore.videoId does not match current videoId",
        httpStatus: 409,
        current,
      };
    }
  }

  const next = { embedCode: nextEmbedCode, videoId: nextVideoId };
  if (current.embedCode === nextEmbedCode) {
    return {
      ok: true,
      saveReadiness: "no_change",
      changedFields: [],
      current,
      next,
      patchedContentText: null,
    };
  }

  const patched = JSON.parse(JSON.stringify(input.config)) as Record<string, unknown>;
  const matches = findYoutubeTargetItems(patched);
  if (matches.length !== 1) {
    return { ok: false, error: "patch target missing or ambiguous", httpStatus: 409 };
  }
  const target = matches[0] as Record<string, unknown>;
  const before = { ...target };
  target.embedCode = nextEmbedCode;

  for (const key of FORBIDDEN_PATCH_FIELDS) {
    if (before[key] !== target[key]) {
      return {
        ok: false,
        error: `forbidden field would change: ${key}`,
        httpStatus: 422,
      };
    }
  }
  if ("videoId" in target && before.videoId !== target.videoId) {
    return { ok: false, error: "videoId must not be written to JSON", httpStatus: 422 };
  }

  return {
    ok: true,
    saveReadiness: "changed",
    changedFields: [GOSAKI_YOUTUBE_PATCH_FIELD],
    current,
    next,
    patchedContentText: `${JSON.stringify(patched, null, 2)}\n`,
  };
}

export function buildYoutubeSaveFingerprint(input: {
  githubFileSha: string;
  before: YoutubeEmbedSnapshot;
  after: YoutubeEmbedSnapshot;
}): YoutubeSaveFingerprint {
  return {
    branch: GOSAKI_YOUTUBE_GITHUB_BRANCH,
    targetFilePath: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    targetItemId: GOSAKI_YOUTUBE_TARGET_ITEM_ID,
    githubFileSha: String(input.githubFileSha ?? "").trim(),
    beforeEmbedCode: String(input.before.embedCode ?? "").trim(),
    beforeVideoId: input.before.videoId,
    afterEmbedCode: String(input.after.embedCode ?? "").trim(),
    afterVideoId: input.after.videoId,
  };
}

export function serializeYoutubeSaveFingerprint(fp: YoutubeSaveFingerprint): string {
  return JSON.stringify({
    branch: fp.branch,
    targetFilePath: fp.targetFilePath,
    targetItemId: fp.targetItemId,
    githubFileSha: fp.githubFileSha,
    beforeEmbedCode: fp.beforeEmbedCode,
    beforeVideoId: fp.beforeVideoId,
    afterEmbedCode: fp.afterEmbedCode,
    afterVideoId: fp.afterVideoId,
  });
}

export function parseYoutubeSaveFingerprint(
  raw: unknown,
): { ok: true; fingerprint: YoutubeSaveFingerprint; serialized: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "fingerprint must be a non-empty string" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "fingerprint must be valid JSON" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "fingerprint must be a JSON object" };
  }
  const record = parsed as Record<string, unknown>;
  const fingerprint: YoutubeSaveFingerprint = {
    branch: String(record.branch ?? "").trim(),
    targetFilePath: String(record.targetFilePath ?? "").trim(),
    targetItemId: String(record.targetItemId ?? "").trim(),
    githubFileSha: String(record.githubFileSha ?? "").trim(),
    beforeEmbedCode: String(record.beforeEmbedCode ?? "").trim(),
    beforeVideoId:
      record.beforeVideoId == null ? null : String(record.beforeVideoId).trim() || null,
    afterEmbedCode: String(record.afterEmbedCode ?? "").trim(),
    afterVideoId:
      record.afterVideoId == null ? null : String(record.afterVideoId).trim() || null,
  };
  if (fingerprint.branch !== GOSAKI_YOUTUBE_GITHUB_BRANCH) {
    return { ok: false, error: "fingerprint.branch mismatch" };
  }
  if (fingerprint.targetFilePath !== GOSAKI_YOUTUBE_GITHUB_FILE_PATH) {
    return { ok: false, error: "fingerprint.targetFilePath mismatch" };
  }
  if (fingerprint.targetItemId !== GOSAKI_YOUTUBE_TARGET_ITEM_ID) {
    return { ok: false, error: "fingerprint.targetItemId mismatch" };
  }
  if (!fingerprint.githubFileSha) {
    return { ok: false, error: "fingerprint.githubFileSha required" };
  }
  return {
    ok: true,
    fingerprint,
    serialized: serializeYoutubeSaveFingerprint(fingerprint),
  };
}

export function fingerprintsEqual(a: string, b: string): boolean {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

export async function loadYoutubeEmbedJsonFromGithub(input?: {
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | { ok: true; file: GitHubContentsFile; config: unknown; snapshot: YoutubeEmbedSnapshot }
  | { ok: false; error: string; httpStatus: number }
> {
  const got = await getGithubContentsFile({
    path: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    ref: GOSAKI_YOUTUBE_GITHUB_BRANCH,
    fetchImpl: input?.fetchImpl,
    auth: input?.auth,
  });
  if (!got.ok) {
    return { ok: false, error: got.error, httpStatus: got.httpStatus };
  }

  let config: unknown;
  try {
    config = JSON.parse(got.file.contentText);
  } catch {
    return { ok: false, error: "GitHub JSON parse failed", httpStatus: 502 };
  }

  const snap = readYoutubeTargetSnapshot(config);
  if (!snap.ok) {
    return { ok: false, error: snap.error, httpStatus: snap.httpStatus };
  }

  return { ok: true, file: got.file, config, snapshot: snap.snapshot };
}

export function buildYoutubeCommitMessage(input: {
  requestId: string;
  approvalId: string;
  operationId: string;
}): string {
  return `cms-kit(gosaki-youtube): patch embedCode [request_id=${input.requestId}] [approval=${input.approvalId}] [operation=${input.operationId}]`;
}

export async function commitYoutubeEmbedCodePatch(input: {
  patchedContentText: string;
  previousFileSha: string;
  message: string;
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | {
      ok: true;
      previousFileSha: string;
      newFileSha: string;
      commitSha: string;
      commitUrl: string | null;
    }
  | {
      ok: false;
      error: string;
      httpStatus: number;
      conflict?: boolean;
      indeterminate?: boolean;
    }
> {
  const put = await updateGithubContentsFile({
    path: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    contentText: input.patchedContentText,
    message: input.message,
    sha: input.previousFileSha,
    branch: GOSAKI_YOUTUBE_GITHUB_BRANCH,
    fetchImpl: input.fetchImpl,
    auth: input.auth,
  });
  if (!put.ok) {
    return {
      ok: false,
      error: put.error,
      httpStatus: put.httpStatus,
      conflict: put.conflict,
      indeterminate: put.indeterminate,
    };
  }
  return {
    ok: true,
    previousFileSha: input.previousFileSha,
    newFileSha: put.result.contentSha,
    commitSha: put.result.commitSha,
    commitUrl: put.result.commitHtmlUrl,
  };
}
