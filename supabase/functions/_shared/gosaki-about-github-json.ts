/**
 * Gosaki About content JSON — GitHub Contents runtime source of truth.
 * Reuses getGithubContentsFile / updateGithubContentsFile. No workflow_dispatch.
 */

import {
  getGithubContentsFile,
  updateGithubContentsFile,
  type GitHubContentsFile,
} from "./github.ts";
import {
  GOSAKI_ABOUT_SITE_SLUG,
  planAboutContentPatch,
  readAboutSnapshotFromConfig,
  type AboutContentSnapshot,
} from "./gosaki-about-html-patch.ts";
import { assertExactObjectKeys, fingerprintsEqual } from "./gosaki-youtube-github-json.ts";

export { assertExactObjectKeys, fingerprintsEqual };
export {
  GOSAKI_ABOUT_SITE_SLUG,
  planAboutContentPatch,
  readAboutSnapshotFromConfig,
  type AboutContentSnapshot,
};

export const GOSAKI_ABOUT_GITHUB_BRANCH = "main";
export const GOSAKI_ABOUT_GITHUB_FILE_PATH =
  "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
export const GOSAKI_ABOUT_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const GOSAKI_ABOUT_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";

export type AboutSaveFingerprint = {
  branch: string;
  targetFilePath: string;
  githubFileSha: string;
  before: AboutContentSnapshot;
  after: AboutContentSnapshot;
};

export function assertGosakiAboutStagingSupabaseHost(): string | null {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  if (!url) return "SUPABASE_URL is not configured";
  if (url.includes(GOSAKI_ABOUT_PRODUCTION_PROJECT_REF)) {
    return "production Supabase project blocked";
  }
  if (!url.includes(GOSAKI_ABOUT_STAGING_PROJECT_REF)) {
    return `staging project ref ${GOSAKI_ABOUT_STAGING_PROJECT_REF} required`;
  }
  return null;
}

export function buildAboutSaveFingerprint(input: {
  githubFileSha: string;
  before: AboutContentSnapshot;
  after: AboutContentSnapshot;
}): AboutSaveFingerprint {
  return {
    branch: GOSAKI_ABOUT_GITHUB_BRANCH,
    targetFilePath: GOSAKI_ABOUT_GITHUB_FILE_PATH,
    githubFileSha: String(input.githubFileSha ?? "").trim(),
    before: input.before,
    after: input.after,
  };
}

export function serializeAboutSaveFingerprint(fp: AboutSaveFingerprint): string {
  return JSON.stringify({
    branch: fp.branch,
    targetFilePath: fp.targetFilePath,
    githubFileSha: fp.githubFileSha,
    before: fp.before,
    after: fp.after,
  });
}

export function parseAboutSaveFingerprint(
  raw: unknown,
): { ok: true; fingerprint: AboutSaveFingerprint; serialized: string } | { ok: false; error: string } {
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
  const fingerprint: AboutSaveFingerprint = {
    branch: String(record.branch ?? "").trim(),
    targetFilePath: String(record.targetFilePath ?? "").trim(),
    githubFileSha: String(record.githubFileSha ?? "").trim(),
    before: record.before as AboutContentSnapshot,
    after: record.after as AboutContentSnapshot,
  };
  if (fingerprint.branch !== GOSAKI_ABOUT_GITHUB_BRANCH) {
    return { ok: false, error: "fingerprint.branch mismatch" };
  }
  if (fingerprint.targetFilePath !== GOSAKI_ABOUT_GITHUB_FILE_PATH) {
    return { ok: false, error: "fingerprint.targetFilePath mismatch" };
  }
  if (!fingerprint.githubFileSha) {
    return { ok: false, error: "fingerprint.githubFileSha required" };
  }
  if (!fingerprint.before || !fingerprint.after) {
    return { ok: false, error: "fingerprint.before/after required" };
  }
  return {
    ok: true,
    fingerprint,
    serialized: serializeAboutSaveFingerprint(fingerprint),
  };
}

export async function loadAboutContentJsonFromGithub(input?: {
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | {
      ok: true;
      file: GitHubContentsFile;
      config: unknown;
      snapshot: AboutContentSnapshot;
    }
  | { ok: false; error: string; httpStatus: number }
> {
  const got = await getGithubContentsFile({
    path: GOSAKI_ABOUT_GITHUB_FILE_PATH,
    ref: GOSAKI_ABOUT_GITHUB_BRANCH,
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

  const snap = readAboutSnapshotFromConfig(config);
  if (!snap.ok) {
    return { ok: false, error: snap.error, httpStatus: snap.httpStatus };
  }

  return { ok: true, file: got.file, config, snapshot: snap.snapshot };
}

export function buildAboutCommitMessage(input: {
  requestId: string;
  approvalId: string;
  operationId: string;
}): string {
  return `cms-kit(gosaki-about): patch about content [request_id=${input.requestId}] [approval=${input.approvalId}] [operation=${input.operationId}]`;
}

export async function commitAboutContentPatch(input: {
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
    path: GOSAKI_ABOUT_GITHUB_FILE_PATH,
    contentText: input.patchedContentText,
    message: input.message,
    sha: input.previousFileSha,
    branch: GOSAKI_ABOUT_GITHUB_BRANCH,
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
