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
 * Compare lftp `pwd` output to the guarded remote-dir secret.
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
  const lines = String(pwdOutput ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const pwd = (lines[lines.length - 1] ?? "").replace(/\/+$/, "");
  const expected = String(expectedNormalized ?? "").replace(/\/+$/, "");
  if (!pwd || !expected) return false;
  if (pwd === "/" || pwd === "." || expected === "/" || expected === ".") return false;
  if (pwd === expected) return true;

  const expectedIsSingleSegment = !expected.includes("/");
  if (!expectedIsSingleSegment) return false;
  if (path.posix.basename(pwd) !== expected) return false;
  return pwd === `/${expected}`;
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
    const match = pwdMatchesExpected(pwdOutput, assessed.normalized);
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
