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
 * Last non-empty lftp stdout line, plus FTP URL → pathname only.
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
  const last = lines[lines.length - 1] ?? "";
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

function main(argv = process.argv.slice(2)) {
  const matchFileIdx = argv.indexOf("--match-pwd-file");
  if (matchFileIdx >= 0) {
    const filePath = argv[matchFileIdx + 1];
    const assessed = assessGosakiProductionFtpRemoteDir(
      process.env.GOSAKI_PRODUCTION_FTP_REMOTE_DIR ?? "",
    );
    printBool("remote_dir_ok", assessed.ok);
    if (!assessed.ok) {
      process.exitCode = 1;
      return;
    }
    const pwdOutput = fs.readFileSync(filePath, "utf8");
    const inspected = inspectPwdOutput(pwdOutput);
    const match = Boolean(inspected.ok) && pwdMatchesExpected(pwdOutput, assessed.normalized);
    printBool("last_line_is_ftp_url", inspected.lastLineIsFtpUrl);
    printBool("url_parse_ok", inspected.urlParseOk);
    printBool("pathname_eq_root", inspected.pathnameEqRoot);
    printBool("pwd_match", match);
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
