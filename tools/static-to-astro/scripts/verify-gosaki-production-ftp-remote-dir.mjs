#!/usr/bin/env node
/**
 * Gosaki production FTP remote-dir guard + pwd matcher cases.
 * No FTP connect.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assessGosakiProductionFtpRemoteDir,
  inspectPwdOutput,
  pwdMatchesExpected,
} from "./gosaki-production-ftp-remote-dir-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const GUARD = path.join(TOOL_ROOT, "scripts/gosaki-production-ftp-remote-dir-guard.mjs");

/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const passes = [];

function assert(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

assert("guard gosaki-piano relative", assessGosakiProductionFtpRemoteDir("gosaki-piano").ok === true);
assert("guard rejects /", assessGosakiProductionFtpRemoteDir("/").ok === false);
assert("guard rejects .", assessGosakiProductionFtpRemoteDir(".").ok === false);
assert("guard rejects ./", assessGosakiProductionFtpRemoteDir("./").ok === false);
assert("guard rejects empty", assessGosakiProductionFtpRemoteDir("").ok === false);
assert("guard rejects ../", assessGosakiProductionFtpRemoteDir("../").ok === false);
assert(
  "guard still accepts nested absolute",
  assessGosakiProductionFtpRemoteDir("/home/users/2/example/web/gosaki").ok === true,
);

assert("pwd gosaki-piano vs /gosaki-piano", pwdMatchesExpected("/gosaki-piano", "gosaki-piano"));
assert("pwd gosaki-piano vs gosaki-piano", pwdMatchesExpected("gosaki-piano", "gosaki-piano"));
assert("pwd gosaki-piano vs / false", pwdMatchesExpected("/", "gosaki-piano") === false);
assert("pwd gosaki-piano vs . false", pwdMatchesExpected(".", "gosaki-piano") === false);
assert(
  "pwd gosaki-piano vs /not-gosaki-piano false",
  pwdMatchesExpected("/not-gosaki-piano", "gosaki-piano") === false,
);
assert(
  "pwd gosaki-piano vs /foo/gosaki-piano false (login-root single segment only)",
  pwdMatchesExpected("/foo/gosaki-piano", "gosaki-piano") === false,
);
assert(
  "pwd nested exact still true",
  pwdMatchesExpected(
    "/home/users/2/example/web/gosaki",
    "/home/users/2/example/web/gosaki",
  ),
);

assert(
  "pwd ftp host-only url",
  pwdMatchesExpected("ftp://example.invalid/gosaki-piano", "gosaki-piano"),
);
assert(
  "pwd ftps host-only url",
  pwdMatchesExpected("ftps://example.invalid/gosaki-piano", "gosaki-piano"),
);
assert(
  "pwd ftp user url",
  pwdMatchesExpected("ftp://user@example.invalid/gosaki-piano", "gosaki-piano"),
);
assert(
  "pwd ftp user dummy-pass url",
  pwdMatchesExpected("ftp://user:dummy@example.invalid/gosaki-piano", "gosaki-piano"),
);
assert(
  "pwd ftp root url false",
  pwdMatchesExpected("ftp://example.invalid/", "gosaki-piano") === false,
);
assert(
  "pwd ftp host-only root false",
  pwdMatchesExpected("ftp://example.invalid", "gosaki-piano") === false,
);
assert(
  "pwd ftp not-gosaki-piano false",
  pwdMatchesExpected("ftp://example.invalid/not-gosaki-piano", "gosaki-piano") === false,
);
assert(
  "pwd ftp nested lookalike false",
  pwdMatchesExpected("ftp://example.invalid/foo/gosaki-piano", "gosaki-piano") === false,
);
assert(
  "pwd malformed ftp url false",
  pwdMatchesExpected("ftp://[", "gosaki-piano") === false,
);
assert(
  "pwd empty ftp url false",
  pwdMatchesExpected("ftp://", "gosaki-piano") === false,
);
assert(
  "pwd ftp trailing slash still matches",
  pwdMatchesExpected("ftp://example.invalid/gosaki-piano/", "gosaki-piano"),
);
assert(
  "pwd ftp url does not suffix-match",
  pwdMatchesExpected("ftp://example.invalid/xxgosaki-piano", "gosaki-piano") === false,
);
assert(
  "pwd ftp multi-segment expected still exact",
  pwdMatchesExpected(
    "ftp://example.invalid/home/users/2/example/web/gosaki",
    "/home/users/2/example/web/gosaki",
  ),
);
assert(
  "pwd ftp multi-segment expected rejects other path",
  pwdMatchesExpected(
    "ftp://example.invalid/gosaki",
    "/home/users/2/example/web/gosaki",
  ) === false,
);

const urlInspect = inspectPwdOutput("ftp://user:dummy@example.invalid/gosaki-piano\n");
assert("url inspect lastLineIsFtpUrl", urlInspect.lastLineIsFtpUrl === true);
assert("url inspect urlParseOk", urlInspect.urlParseOk === true);
assert("url inspect pathname not root", urlInspect.pathnameEqRoot === false);
assert("url inspect path is pathname only", urlInspect.path === "/gosaki-piano");
assert(
  "url inspect has no credential fields",
  !("username" in urlInspect) &&
    !("password" in urlInspect) &&
    !("host" in urlInspect) &&
    !("hostname" in urlInspect) &&
    !("href" in urlInspect) &&
    !("raw" in urlInspect),
);

const rootUrlInspect = inspectPwdOutput("ftp://example.invalid/\n");
assert("root url inspect pathnameEqRoot", rootUrlInspect.pathnameEqRoot === true);
assert(
  "root url inspect does not match",
  pwdMatchesExpected("ftp://example.invalid/\n", "gosaki-piano") === false,
);

const malformedInspect = inspectPwdOutput("ftp://[\n");
assert("malformed inspect lastLineIsFtpUrl", malformedInspect.lastLineIsFtpUrl === true);
assert("malformed inspect urlParseOk false", malformedInspect.urlParseOk === false);
assert("malformed inspect ok false", malformedInspect.ok === false);

const pathInspect = inspectPwdOutput("/gosaki-piano\n");
assert("path inspect not ftp url", pathInspect.lastLineIsFtpUrl === false);
assert("path inspect urlParseOk false", pathInspect.urlParseOk === false);

const guardSrc = fs.readFileSync(GUARD, "utf8");
assert("guard source has no suffix compare", !guardSrc.includes(".endsWith("));
assert("guard source does not log href", !/console\.log\([^)]*href/.test(guardSrc));
assert("guard source does not print pathname labels", !/console\.log\([^)]*pathname/.test(guardSrc));

function runMatchPwdFile(contents) {
  const tmp = path.join(os.tmpdir(), `gosaki-pwd-url-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(tmp, contents, "utf8");
  try {
    return spawnSync(process.execPath, [GUARD, "--match-pwd-file", tmp], {
      encoding: "utf8",
      env: { ...process.env, GOSAKI_PRODUCTION_FTP_REMOTE_DIR: "gosaki-piano" },
      cwd: TOOL_ROOT,
    });
  } finally {
    fs.unlinkSync(tmp);
  }
}

const cliUrl = runMatchPwdFile("ftp://user:dummy@example.invalid/gosaki-piano\n");
const cliOut = `${cliUrl.stdout ?? ""}${cliUrl.stderr ?? ""}`;
assert("cli url pwd_match true", /pwd_match true/.test(cliUrl.stdout ?? ""));
assert("cli url last_line_is_ftp_url true", /last_line_is_ftp_url true/.test(cliUrl.stdout ?? ""));
assert("cli url url_parse_ok true", /url_parse_ok true/.test(cliUrl.stdout ?? ""));
assert("cli url pathname_eq_root false", /pathname_eq_root false/.test(cliUrl.stdout ?? ""));
assert("cli url does not echo dummy", !cliOut.includes("dummy"));
assert("cli url does not echo example.invalid", !cliOut.includes("example.invalid"));
assert("cli url does not echo ftp://", !cliOut.includes("ftp://"));
assert("cli url does not echo pathname", !cliOut.includes("/gosaki-piano"));
assert("cli url exit 0", cliUrl.status === 0);

const cliBad = runMatchPwdFile("ftp://[\n");
const cliBadOut = `${cliBad.stdout ?? ""}${cliBad.stderr ?? ""}`;
assert("cli malformed pwd_match false", /pwd_match false/.test(cliBad.stdout ?? ""));
assert("cli malformed url_parse_ok false", /url_parse_ok false/.test(cliBad.stdout ?? ""));
assert("cli malformed does not echo ftp://", !cliBadOut.includes("ftp://"));
assert("cli malformed exit 1", cliBad.status === 1);

console.log(`verify-gosaki-production-ftp-remote-dir: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`PASS ${name}`);
for (const name of failures) console.log(`FAIL ${name}`);
if (failures.length > 0) process.exit(1);
