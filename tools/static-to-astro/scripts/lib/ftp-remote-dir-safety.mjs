/**
 * Shared FTP remote directory safety checks (G-7f1).
 * No FTP connection — static validation only.
 */

export const DANGEROUS_DIR_KEYWORDS = [
  "public_html",
  "www",
  "htdocs",
  "production",
  "prod",
  "live",
  "sariswing",
  "sariswing.com",
  "gosaki-piano.com",
];

/** Staging deploy must include at least one of these (case-insensitive). */
export const REQUIRED_STAGING_DIR_KEYWORDS = [
  "cms-kit-staging",
  "staging",
  "stage",
  "test",
  "preview",
  "cms-kit",
  "sandbox",
];

const MIN_SERVER_DIR_LENGTH = 8;

const BLOCKED_EXACT = new Set(["/", ".", "..", "./", "~", ""]);

/**
 * @param {string | null | undefined} serverDir
 */
export function normalizeRemoteDirForDeploy(serverDir) {
  const raw = (serverDir ?? "").trim();
  const normalized = raw.replace(/\\/g, "/");
  const withoutTrailing = normalized.replace(/\/$/, "") || normalized;
  return { raw, normalized, withoutTrailing };
}

/**
 * @param {string | null | undefined} serverDir
 */
export function assessServerDirPath(serverDir) {
  /** @type {string[]} */
  const errors = [];

  const dir = (serverDir ?? "").trim();
  if (!dir) {
    return { ok: false, errors: ["GOSAKI_STAGING_FTP_SERVER_DIR is empty"], dir: "", hasStagingKeyword: false };
  }

  const { normalized, withoutTrailing } = normalizeRemoteDirForDeploy(dir);

  if (BLOCKED_EXACT.has(normalized) || BLOCKED_EXACT.has(withoutTrailing)) {
    errors.push(`server dir blocked (must not be ${normalized || "(empty)"})`);
  }

  if (normalized.startsWith("../") || withoutTrailing.startsWith("../")) {
    errors.push("server dir must not traverse upward (../)");
  }

  if (normalized === "." || normalized === "./" || withoutTrailing === ".") {
    errors.push("server dir must not be relative only (., ./)");
  }

  if (dir.length < MIN_SERVER_DIR_LENGTH) {
    errors.push(`server dir too short (minimum ${MIN_SERVER_DIR_LENGTH} characters)`);
  }

  const lower = normalized.toLowerCase();
  for (const keyword of DANGEROUS_DIR_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      errors.push(`dangerous keyword in server dir: ${keyword}`);
    }
  }

  const hasStagingKeyword = REQUIRED_STAGING_DIR_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  if (!hasStagingKeyword) {
    errors.push(
      `server dir must include staging marker (${REQUIRED_STAGING_DIR_KEYWORDS.join(", ")})`,
    );
  }

  return { ok: errors.length === 0, errors, dir: normalized, hasStagingKeyword };
}

/**
 * @param {string} pwdOutput
 * @param {string} expectedServerDir
 */
export function remotePwdMatchesExpected(pwdOutput, expectedServerDir) {
  const lines = (pwdOutput ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const pwdLine = lines[lines.length - 1] ?? "";

  const norm = (p) =>
    p
      .trim()
      .replace(/\\/g, "/")
      .replace(/\/$/, "")
      .toLowerCase();

  const pwd = norm(pwdLine);
  const expected = norm(expectedServerDir);

  if (!pwd || !expected) return false;
  return pwd === expected || pwd.endsWith(expected) || expected.endsWith(pwd);
}
