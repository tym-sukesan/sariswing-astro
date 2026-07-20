/**
 * Gosaki YouTube ordered items[] patch / fingerprint (G-11c7).
 * Backward compatible with legacy single-item root fields via normalize.
 * Does not execute GitHub writes by itself.
 */

import {
  GOSAKI_YOUTUBE_GITHUB_BRANCH,
  GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
  GOSAKI_YOUTUBE_SITE_SLUG,
} from "./gosaki-youtube-github-json.ts";
import {
  getGithubContentsFile,
  type GitHubContentsFile,
} from "./github.ts";

/** Local parse — same rules as G-11c1 / github-json helper. */
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

export const G11C7_ITEMS_FIELD = "items";
export const G11C7_ITEMS_DRY_RUN_OPERATION_ID = "G-11c7-gosaki-youtube-items-dry-run";
export const G11C7_ITEMS_DRY_RUN_APPROVAL_ID = "G-11c7-gosaki-youtube-items-dry-run";
export const G11C7_ITEMS_SAVE_OPERATION_ID =
  "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice";
export const G11C7_ITEMS_SAVE_APPROVAL_ID =
  "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice";

export const G11C7_ITEMS_DRY_RUN_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "field",
  "items",
  "dryRun",
  "operationId",
  "approvalId",
] as const;

export const G11C7_ITEMS_SAVE_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "field",
  "items",
  "dryRun",
  "saveEnabled",
  "operationId",
  "approvalId",
  "expectedBeforeItems",
  "fingerprint",
  "requestId",
] as const;

export type YoutubeEmbedItemRecord = {
  id: string;
  published: boolean;
  sortOrder: number;
  embedCode: string;
};

export type YoutubeItemsSaveFingerprint = {
  mode: "items";
  branch: string;
  targetFilePath: string;
  githubFileSha: string;
  beforeItems: YoutubeEmbedItemRecord[];
  afterItems: YoutubeEmbedItemRecord[];
};

const FORBIDDEN_EMBED_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /<script/i,
  /on\w+\s*=/i,
];

export function isYoutubeItemsRequestBody(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  return record.field === G11C7_ITEMS_FIELD || Array.isArray(record.items);
}

export function normalizeEmbedCodeForStorage(raw: string): {
  ok: true;
  embedCode: string;
  videoId: string;
} | { ok: false; error: string } {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: false, error: "embedCode must not be empty" };
  for (const pattern of FORBIDDEN_EMBED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, error: "embedCode contains forbidden patterns" };
    }
  }
  const videoId = parseYoutubeVideoId(trimmed);
  if (!videoId) {
    return { ok: false, error: "embedCode must be a valid YouTube URL, iframe, or videoId" };
  }
  return { ok: true, embedCode: `https://youtu.be/${videoId}`, videoId };
}

export function normalizeYoutubeConfigItems(config: unknown): YoutubeEmbedItemRecord[] {
  if (!config || typeof config !== "object") return [];
  const root = config as Record<string, unknown>;
  if (Array.isArray(root.items) && root.items.length > 0) {
    return root.items
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const id = String(row.id ?? "").trim() || `legacy-${index + 1}`;
        const embedRaw = String(row.embedCode ?? row.sourceUrl ?? row.videoId ?? "").trim();
        const normalized = normalizeEmbedCodeForStorage(embedRaw);
        return {
          id,
          published: row.published === true,
          sortOrder: Number.isFinite(Number(row.sortOrder))
            ? Number(row.sortOrder)
            : (index + 1) * 10,
          embedCode: normalized.ok ? normalized.embedCode : embedRaw,
        } satisfies YoutubeEmbedItemRecord;
      })
      .filter((item): item is YoutubeEmbedItemRecord => item != null)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }

  // Legacy single-item root fields
  if (root.published !== undefined || root.videoId || root.sourceUrl || root.embedCode) {
    const embedRaw = String(root.embedCode ?? root.sourceUrl ?? root.videoId ?? "").trim();
    const normalized = normalizeEmbedCodeForStorage(embedRaw);
    return [
      {
        id: "legacy-single",
        published: root.published === true,
        sortOrder: 10,
        embedCode: normalized.ok ? normalized.embedCode : embedRaw,
      },
    ];
  }
  return [];
}

export function parseYoutubeItemsPayload(
  raw: unknown,
  options?: { allowEmpty?: boolean },
):
  | { ok: true; items: YoutubeEmbedItemRecord[] }
  | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "items must be an array" };
  }
  if (raw.length === 0) {
    if (options?.allowEmpty) return { ok: true, items: [] };
    return { ok: false, error: "items must not be empty" };
  }
  const ids = new Set<string>();
  const items: YoutubeEmbedItemRecord[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const entry = raw[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: `items[${i}] must be an object` };
    }
    const record = entry as Record<string, unknown>;
    const allowed = ["id", "published", "sortOrder", "embedCode"];
    const keys = Object.keys(record).sort();
    for (const key of keys) {
      if (!allowed.includes(key)) {
        return { ok: false, error: `items[${i}] unexpected field: ${key}` };
      }
    }
    for (const key of allowed) {
      if (!(key in record)) {
        return { ok: false, error: `items[${i}] missing field: ${key}` };
      }
    }
    const id = String(record.id ?? "").trim();
    if (!id) return { ok: false, error: `items[${i}].id must be a non-empty string` };
    if (ids.has(id)) return { ok: false, error: `duplicate item id: ${id}` };
    ids.add(id);
    if (typeof record.published !== "boolean") {
      return { ok: false, error: `items[${i}].published must be boolean` };
    }
    if (typeof record.sortOrder !== "number" || !Number.isFinite(record.sortOrder)) {
      return { ok: false, error: `items[${i}].sortOrder must be a finite number` };
    }
    if (typeof record.embedCode !== "string") {
      return { ok: false, error: `items[${i}].embedCode must be a string` };
    }
    const normalized = normalizeEmbedCodeForStorage(record.embedCode);
    if (!normalized.ok) {
      return { ok: false, error: `items[${i}]: ${normalized.error}` };
    }
    items.push({
      id,
      published: record.published,
      sortOrder: record.sortOrder,
      embedCode: normalized.embedCode,
    });
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  // Re-check duplicate after sort is already done via ids set
  return { ok: true, items };
}

function itemsEqual(a: YoutubeEmbedItemRecord[], b: YoutubeEmbedItemRecord[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i].id !== b[i].id ||
      a[i].published !== b[i].published ||
      a[i].sortOrder !== b[i].sortOrder ||
      a[i].embedCode !== b[i].embedCode
    ) {
      return false;
    }
  }
  return true;
}

export function planYoutubeItemsPatch(input: {
  config: unknown;
  nextItems: YoutubeEmbedItemRecord[];
  expectedBeforeItems?: YoutubeEmbedItemRecord[];
  enforceExpectedBefore?: boolean;
}):
  | {
      ok: true;
      saveReadiness: "changed" | "no_change";
      changedFields: string[];
      changedItemIds: string[];
      currentItems: YoutubeEmbedItemRecord[];
      nextItems: YoutubeEmbedItemRecord[];
      patchedContentText: string | null;
      sectionTitle: string;
    }
  | { ok: false; error: string; httpStatus: number; currentItems?: YoutubeEmbedItemRecord[] } {
  if (!input.config || typeof input.config !== "object") {
    return { ok: false, error: "config must be a JSON object", httpStatus: 502 };
  }
  const root = input.config as Record<string, unknown>;
  if (String(root.siteSlug ?? "").trim() !== GOSAKI_YOUTUBE_SITE_SLUG) {
    return {
      ok: false,
      error: `config siteSlug must be ${GOSAKI_YOUTUBE_SITE_SLUG}`,
      httpStatus: 502,
    };
  }

  const currentItems = normalizeYoutubeConfigItems(input.config);
  if (input.enforceExpectedBefore !== false) {
    const expected = input.expectedBeforeItems ?? [];
    if (!itemsEqual(expected, currentItems)) {
      return {
        ok: false,
        error: "expectedBeforeItems does not match current GitHub items",
        httpStatus: 409,
        currentItems,
      };
    }
  }

  const nextItems = [...input.nextItems].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  const changedItemIds: string[] = [];
  const currentMap = new Map(currentItems.map((i) => [i.id, i]));
  const nextMap = new Map(nextItems.map((i) => [i.id, i]));
  for (const item of nextItems) {
    const prev = currentMap.get(item.id);
    if (
      !prev ||
      prev.embedCode !== item.embedCode ||
      prev.published !== item.published ||
      prev.sortOrder !== item.sortOrder
    ) {
      changedItemIds.push(item.id);
    }
  }
  for (const prev of currentItems) {
    if (!nextMap.has(prev.id)) changedItemIds.push(prev.id);
  }

  const sectionTitle = String(root.sectionTitle ?? "YouTube").trim() || "YouTube";
  if (itemsEqual(currentItems, nextItems)) {
    return {
      ok: true,
      saveReadiness: "no_change",
      changedFields: [],
      changedItemIds: [],
      currentItems,
      nextItems,
      patchedContentText: null,
      sectionTitle,
    };
  }

  const patched = JSON.parse(JSON.stringify(input.config)) as Record<string, unknown>;
  patched.siteSlug = GOSAKI_YOUTUBE_SITE_SLUG;
  patched.sectionTitle = sectionTitle;
  patched.items = nextItems.map((item) => ({
    id: item.id,
    published: item.published,
    sortOrder: item.sortOrder,
    embedCode: item.embedCode,
  }));
  // Drop legacy single-item root fields if present
  delete patched.published;
  delete patched.sourceUrl;
  delete patched.videoId;
  delete patched.title;
  delete patched.caption;

  return {
    ok: true,
    saveReadiness: "changed",
    changedFields: [G11C7_ITEMS_FIELD],
    changedItemIds: [...new Set(changedItemIds)],
    currentItems,
    nextItems,
    patchedContentText: `${JSON.stringify(patched, null, 2)}\n`,
    sectionTitle,
  };
}

export function buildYoutubeItemsSaveFingerprint(input: {
  githubFileSha: string;
  beforeItems: YoutubeEmbedItemRecord[];
  afterItems: YoutubeEmbedItemRecord[];
}): YoutubeItemsSaveFingerprint {
  return {
    mode: "items",
    branch: GOSAKI_YOUTUBE_GITHUB_BRANCH,
    targetFilePath: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    githubFileSha: String(input.githubFileSha ?? "").trim(),
    beforeItems: input.beforeItems,
    afterItems: input.afterItems,
  };
}

export function serializeYoutubeItemsSaveFingerprint(fp: YoutubeItemsSaveFingerprint): string {
  return JSON.stringify({
    mode: fp.mode,
    branch: fp.branch,
    targetFilePath: fp.targetFilePath,
    githubFileSha: fp.githubFileSha,
    beforeItems: fp.beforeItems,
    afterItems: fp.afterItems,
  });
}

export function parseYoutubeItemsSaveFingerprint(
  raw: unknown,
):
  | { ok: true; fingerprint: YoutubeItemsSaveFingerprint; serialized: string }
  | { ok: false; error: string } {
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
  if (record.mode !== "items") {
    return { ok: false, error: "fingerprint.mode must be items" };
  }
  const beforeParsed = parseYoutubeItemsPayload(record.beforeItems, { allowEmpty: true });
  if (!beforeParsed.ok) {
    return { ok: false, error: `fingerprint.beforeItems: ${beforeParsed.error}` };
  }
  const afterParsed = parseYoutubeItemsPayload(record.afterItems);
  if (!afterParsed.ok) {
    return { ok: false, error: `fingerprint.afterItems: ${afterParsed.error}` };
  }
  const fingerprint: YoutubeItemsSaveFingerprint = {
    mode: "items",
    branch: String(record.branch ?? "").trim(),
    targetFilePath: String(record.targetFilePath ?? "").trim(),
    githubFileSha: String(record.githubFileSha ?? "").trim(),
    beforeItems: beforeParsed.items,
    afterItems: afterParsed.items,
  };
  if (fingerprint.branch !== GOSAKI_YOUTUBE_GITHUB_BRANCH) {
    return { ok: false, error: "fingerprint.branch mismatch" };
  }
  if (fingerprint.targetFilePath !== GOSAKI_YOUTUBE_GITHUB_FILE_PATH) {
    return { ok: false, error: "fingerprint.targetFilePath mismatch" };
  }
  if (!fingerprint.githubFileSha) {
    return { ok: false, error: "fingerprint.githubFileSha required" };
  }
  return {
    ok: true,
    fingerprint,
    serialized: serializeYoutubeItemsSaveFingerprint(fingerprint),
  };
}

export async function loadYoutubeEmbedConfigFromGithub(input?: {
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | { ok: true; file: GitHubContentsFile; config: unknown }
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
  if (!config || typeof config !== "object") {
    return { ok: false, error: "config must be a JSON object", httpStatus: 502 };
  }
  const siteSlug = String((config as { siteSlug?: unknown }).siteSlug ?? "").trim();
  if (siteSlug !== GOSAKI_YOUTUBE_SITE_SLUG) {
    return {
      ok: false,
      error: `config siteSlug must be ${GOSAKI_YOUTUBE_SITE_SLUG}`,
      httpStatus: 502,
    };
  }
  return { ok: true, file: got.file, config };
}

export function buildYoutubeItemsCommitMessage(input: {
  requestId: string;
  approvalId: string;
  operationId: string;
}): string {
  return `cms-kit(gosaki-youtube): patch items[] [request_id=${input.requestId}] [approval=${input.approvalId}] [operation=${input.operationId}]`;
}
