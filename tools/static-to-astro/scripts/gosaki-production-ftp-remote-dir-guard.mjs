#!/usr/bin/env node
/**
 * Gosaki production FTP remote-dir guard (Actions + local verifier).
 * Does not connect. Does not print credential values.
 *
 * Reject: empty, `/`, `.`, `./`, `~`, `..`, `../` (and prefix `../`).
 * Staging `assessServerDirPath` is intentionally not reused.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BLOCKED_EXACT = new Set(["", "/", ".", "./", "~", "..", "../"]);
const FTP_URL_PREFIX = /^ftps?:\/\//i;
const LFTP_PREFIX = /^(?:---- |<--- |---> )/;
const FTP_257_QUOTED = /\b257-?\s*"((?:[^"]|"")*)"/;

/**
 * @param {string} raw
 * @returns {{ ok: true, normalized: string } | { ok: false, reason: string }}
 */
export function assessGosakiProductionFtpRemoteDir(raw) {
  const value = String(raw ?? "").trim();
  if (BLOCKED_EXACT.has(value)) {
    return { ok: false, reason: "remote_dir_blocked" };
  }
  if (value === "/" || /^\/+$/.test(value)) {
    return { ok: false, reason: "remote_dir_root_rejected" };
  }
  if (value.startsWith("../") || value === "..") {
    return { ok: false, reason: "remote_dir_parent_rejected" };
  }
  if (value === "~" || value.startsWith("~/")) {
    return { ok: false, reason: "remote_dir_home_rejected" };
  }
  const normalized = value.replace(/\/+$/, "") || value;
  if (normalized === "" || normalized === "/") {
    return { ok: false, reason: "remote_dir_root_rejected" };
  }
  return { ok: true, normalized };
}

/**
 * @param {string} value
 */
function isRootPathname(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return true;
  return trimmed.replace(/\/+$/, "") === "";
}

/**
 * RFC 959 257 quoted directory-name. Doubled quotes are unescaped.
 * Accepts optional lftp prefixes (`---- `, `<--- `, `---> `) and `257-`.
 * Returns null when a quoted path cannot be taken safely.
 * Never logs the path.
 *
 * @param {string} line
 * @returns {string | null}
 */
export function extractFtp257QuotedPath(line) {
  const trimmed = String(line ?? "").trim().replace(LFTP_PREFIX, "");
  const matched = trimmed.match(FTP_257_QUOTED);
  if (!matched) return null;
  return matched[1].replace(/""/g, '"');
}

function pathSegmentCount(value) {
  return String(value ?? "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean).length;
}

/**
 * Strict path matcher. `pwdPath` is already a filesystem-style path
 * (or an FTP URL pathname). Suffix matching is forbidden.
 *
 * @param {string} pwdPath
 * @param {string} expectedNormalized
 */
function pwdPathMatchesExpected(pwdPath, expectedNormalized) {
  const pwd = String(pwdPath ?? "").trim().replace(/\/+$/, "");
  const expected = String(expectedNormalized ?? "").replace(/\/+$/, "");
  if (!pwd || !expected) return false;
  if (pwd === "/" || pwd === "." || expected === "/" || expected === ".") return false;
  if (pwd === expected) return true;

  const expectedIsSingleSegment = !expected.includes("/");
  if (!expectedIsSingleSegment) return false;
  if (path.posix.basename(pwd) !== expected) return false;
  return pwd === `/${expected}`;
}

/**
 * Boolean/count shape of a capture blob. Never returns raw text.
 *
 * @param {string} text
 */
export function inspectCaptureFormat(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    lineCount: lines.length,
    has257Token: /\b257\b/.test(String(text ?? "")),
    hasQuotedString: /"(?:[^"]|"")*"/.test(String(text ?? "")),
    hasLftpPrefix: lines.some((line) => LFTP_PREFIX.test(line)),
  };
}

/**
 * Login (first 257) vs post-cd (last 257) server PWD booleans.
 * `eqGosakiPiano` uses the same strict path matcher as lftp pwd.
 *
 * @param {string} pwdOutput
 * @param {string} expectedNormalized
 */
export function inspectServerPwdReplies(pwdOutput, expectedNormalized) {
  const paths = [];
  for (const line of String(pwdOutput ?? "").split(/\r?\n/)) {
    const extracted = extractFtp257QuotedPath(line);
    if (extracted !== null) paths.push(extracted);
  }
  const parseOk = paths.length > 0;
  const loginPath = paths[0] ?? "";
  const postPath = paths.length >= 2 ? paths[paths.length - 1] : loginPath;
  const eqRoot = parseOk && isRootPathname(postPath);
  const eqGosakiPiano = parseOk && pwdPathMatchesExpected(postPath, expectedNormalized);
  const nested = parseOk && !eqRoot && pathSegmentCount(postPath) >= 2;
  const changed = paths.length >= 2 && loginPath !== postPath;
  return {
    parseOk,
    eqRoot,
    eqGosakiPiano,
    nested,
    changed,
    replyCount: paths.length,
  };
}

/**
 * Last lftp URL line (or last non-257 line), plus FTP URL → pathname only.
 * Never returns username, password, host, href, or the raw line.
 *
 * @param {string} pwdOutput
 * @returns {{
 *   ok: boolean,
 *   path: string,
 *   lastLineIsFtpUrl: boolean,
 *   urlParseOk: boolean,
 *   pathnameEqRoot: boolean,
 * }}
 */
export function inspectPwdOutput(pwdOutput) {
  const lines = String(pwdOutput ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const ftpLines = lines.filter((line) => FTP_URL_PREFIX.test(line));
  const non257 = lines.filter((line) => extractFtp257QuotedPath(line) === null);
  const last = ftpLines[ftpLines.length - 1] ?? non257[non257.length - 1] ?? "";
  const lastLineIsFtpUrl = FTP_URL_PREFIX.test(last);

  if (!last) {
    return {
      ok: false,
      path: "",
      lastLineIsFtpUrl: false,
      urlParseOk: false,
      pathnameEqRoot: false,
    };
  }

  if (!lastLineIsFtpUrl) {
    return {
      ok: true,
      path: last,
      lastLineIsFtpUrl: false,
      urlParseOk: false,
      pathnameEqRoot: isRootPathname(last),
    };
  }

  try {
    const parsed = new URL(last);
    const pathname = String(parsed.pathname ?? "");
    if (!pathname) {
      return {
        ok: false,
        path: "",
        lastLineIsFtpUrl: true,
        urlParseOk: true,
        pathnameEqRoot: true,
      };
    }
    return {
      ok: true,
      path: pathname,
      lastLineIsFtpUrl: true,
      urlParseOk: true,
      pathnameEqRoot: isRootPathname(pathname),
    };
  } catch {
    return {
      ok: false,
      path: "",
      lastLineIsFtpUrl: true,
      urlParseOk: false,
      pathnameEqRoot: false,
    };
  }
}

/**
 * Compare lftp `pwd` output to the guarded remote-dir secret.
 *
 * lftp 4.9.x `pwd` prints the current remote URL (not a bare path).
 * FTP/FTPS URLs are reduced to `URL.pathname` before matching.
 * Parse failure or an empty pathname is a mismatch.
 *
 * Multi-segment expected paths keep exact equality (after trailing-slash strip).
 * A slash-free single-segment expected (e.g. `gosaki-piano`) also matches
 * `/gosaki-piano`, because relative `cd gosaki-piano` from FTP login root
 * typically yields that absolute PWD. Deeper paths such as `/foo/gosaki-piano`
 * are rejected: login-root listing is `gosaki-piano/` next to `welcome.html`,
 * so `cd gosaki-piano` must not land in a nested lookalike.
 *
 * `/` and `.` never match. Suffix matching is forbidden (`/not-gosaki-piano`).
 *
 * @param {string} pwdOutput
 * @param {string} expectedNormalized
 */
export function pwdMatchesExpected(pwdOutput, expectedNormalized) {
  const inspected = inspectPwdOutput(pwdOutput);
  if (!inspected.ok) return false;
  return pwdPathMatchesExpected(inspected.path, expectedNormalized);
}

function printBool(name, value) {
  console.log(`${name} ${value ? "true" : "false"}`);
}

function printCount(name, value) {
  console.log(`${name} ${Number(value) || 0}`);
}

function takeFlagValues(argv, flag) {
  const values = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === flag && argv[i + 1]) {
      values.push(argv[i + 1]);
      i += 1;
    }
  }
  return values;
}

function readOptionalFile(filePath) {
  if (!filePath) return "";
  return fs.readFileSync(filePath, "utf8");
}

function main(argv = process.argv.slice(2)) {
  const matchFileIdx = argv.indexOf("--match-pwd-file");
  if (matchFileIdx >= 0) {
    const filePath = argv[matchFileIdx + 1];
    const stderrPath = takeFlagValues(argv, "--match-stderr-file")[0];
    const quotePaths = takeFlagValues(argv, "--match-quote-file");
    const assessed = assessGosakiProductionFtpRemoteDir(
      process.env.GOSAKI_PRODUCTION_FTP_REMOTE_DIR ?? "",
    );
    printBool("remote_dir_ok", assessed.ok);
    if (!assessed.ok) {
      process.exitCode = 1;
      return;
    }
    const stdoutText = readOptionalFile(filePath);
    const stderrText = stderrPath ? readOptionalFile(stderrPath) : "";
    const quoteTexts = quotePaths.map((p) => readOptionalFile(p));
    const combined = [stdoutText, stderrText, ...quoteTexts].join("\n");
    const stdoutFmt = inspectCaptureFormat(stdoutText);
    const stderrFmt = inspectCaptureFormat(stderrText);
    const inspected = inspectPwdOutput(stdoutText);
    const server = inspectServerPwdReplies(combined, assessed.normalized);
    const match = Boolean(inspected.ok) && pwdMatchesExpected(stdoutText, assessed.normalized);
    printCount("stdout_line_count", stdoutFmt.lineCount);
    printCount("stderr_line_count", stderrFmt.lineCount);
    printBool("stdout_has_257_token", stdoutFmt.has257Token);
    printBool("stderr_has_257_token", stderrFmt.has257Token);
    printBool("stdout_has_quoted_string", stdoutFmt.hasQuotedString);
    printBool("stderr_has_quoted_string", stderrFmt.hasQuotedString);
    printBool("stdout_has_lftp_prefix", stdoutFmt.hasLftpPrefix);
    printBool("stderr_has_lftp_prefix", stderrFmt.hasLftpPrefix);
    printCount("parser_candidate_count", server.replyCount);
    printBool("last_line_is_ftp_url", inspected.lastLineIsFtpUrl);
    printBool("url_parse_ok", inspected.urlParseOk);
    printBool("pathname_eq_root", inspected.pathnameEqRoot);
    printBool("server_pwd_parse_ok", server.parseOk);
    printBool("server_pwd_eq_root", server.eqRoot);
    printBool("server_pwd_eq_gosaki_piano", server.eqGosakiPiano);
    printBool("server_pwd_nested", server.nested);
    printBool("server_pwd_changed", server.changed);
    printBool("pwd_match", match);
    if (server.replyCount > 0) {
      if (!server.parseOk) process.exitCode = 1;
      return;
    }
    if (!match) process.exitCode = 1;
    return;
  }

  const assessed = assessGosakiProductionFtpRemoteDir(
    process.env.GOSAKI_PRODUCTION_FTP_REMOTE_DIR ?? "",
  );
  printBool("remote_dir_ok", assessed.ok);
  if (!assessed.ok) {
    process.exitCode = 1;
    return;
  }
  if (argv.includes("--normalized")) {
    process.stdout.write(`${assessed.normalized}\n`);
  }
}

const isDirect =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main();
}
