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
  extractFtp257QuotedPath,
  inspectCaptureFormat,
  inspectPwdOutput,
  inspectServerPwdReplies,
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

assert("257 root quoted path", extractFtp257QuotedPath('257 "/" is current directory.') === "/");
assert("257 gosaki-piano quoted path", extractFtp257QuotedPath('257 "/gosaki-piano"') === "/gosaki-piano");
assert("257 relative quoted path", extractFtp257QuotedPath('257 "gosaki-piano"') === "gosaki-piano");
assert("257 escaped quote", extractFtp257QuotedPath('257 "/foo""bar"') === '/foo"bar');
assert("257 nested quoted path", extractFtp257QuotedPath('257 "/foo/gosaki-piano" is current directory.') === "/foo/gosaki-piano");
assert("257 missing quotes malformed", extractFtp257QuotedPath("257 /gosaki-piano") === null);
assert("257 unclosed quote malformed", extractFtp257QuotedPath('257 "/gosaki-piano') === null);
assert("250 is not 257", extractFtp257QuotedPath("250 Directory successfully changed.") === null);
assert(
  "257 prefixed arrow",
  extractFtp257QuotedPath('<--- 257 "/gosaki-piano" is current directory.') === "/gosaki-piano",
);
assert(
  "257 prefixed dashes",
  extractFtp257QuotedPath('---- 257 "/gosaki-piano"') === "/gosaki-piano",
);
assert("257- multiline first line", extractFtp257QuotedPath('257-"/gosaki-piano"') === "/gosaki-piano");
assert("257- with space then quote", extractFtp257QuotedPath('257- "/gosaki-piano"') === "/gosaki-piano");

const serverRoot = inspectServerPwdReplies('257 "/" is current directory.\n', "gosaki-piano");
assert("server root parse ok", serverRoot.parseOk === true);
assert("server root eq root", serverRoot.eqRoot === true);
assert("server root not gosaki", serverRoot.eqGosakiPiano === false);
assert("server root not nested", serverRoot.nested === false);
assert("server root not changed", serverRoot.changed === false);

const serverGosaki = inspectServerPwdReplies(
  '257 "/" is current directory.\n257 "/gosaki-piano" is current directory.\n',
  "gosaki-piano",
);
assert("server gosaki parse ok", serverGosaki.parseOk === true);
assert("server gosaki not root", serverGosaki.eqRoot === false);
assert("server gosaki eq gosaki-piano", serverGosaki.eqGosakiPiano === true);
assert("server gosaki not nested", serverGosaki.nested === false);
assert("server gosaki changed", serverGosaki.changed === true);

const serverNested = inspectServerPwdReplies(
  '257 "/" is current directory.\n257 "/foo/gosaki-piano" is current directory.\n',
  "gosaki-piano",
);
assert("server nested not gosaki", serverNested.eqGosakiPiano === false);
assert("server nested true", serverNested.nested === true);

const serverMalformed = inspectServerPwdReplies("257 /gosaki-piano\n", "gosaki-piano");
assert("server malformed parse false", serverMalformed.parseOk === false);

const serverPrefixed = inspectServerPwdReplies(
  '<--- 257 "/" is current directory.\n<--- 257 "/gosaki-piano" is current directory.\n',
  "gosaki-piano",
);
assert("server prefixed parse ok", serverPrefixed.parseOk === true);
assert("server prefixed eq gosaki-piano", serverPrefixed.eqGosakiPiano === true);
assert("server prefixed changed", serverPrefixed.changed === true);

const serverMultiline = inspectServerPwdReplies(
  '257-"/"\n257 End\n257-"/gosaki-piano"\n257 End\n',
  "gosaki-piano",
);
assert("server multiline parse ok", serverMultiline.parseOk === true);
assert("server multiline eq gosaki-piano", serverMultiline.eqGosakiPiano === true);
assert("server multiline changed", serverMultiline.changed === true);

const fmt257 = inspectCaptureFormat('257 "/gosaki-piano" is current directory.\n');
assert("format has 257 token", fmt257.has257Token === true);
assert("format has quoted string", fmt257.hasQuotedString === true);
assert("format line count", fmt257.lineCount === 1);
assert("format no lftp prefix", fmt257.hasLftpPrefix === false);
const fmtPrefix = inspectCaptureFormat('<--- 257 "/" is current directory.\n');
assert("format detects lftp prefix", fmtPrefix.hasLftpPrefix === true);
assert(
  "format inspect has no raw fields",
  !("text" in fmt257) && !("sample" in fmt257) && !("path" in fmt257),
);

assert(
  "server inspect has no path fields",
  !("path" in serverGosaki) &&
    !("loginPath" in serverGosaki) &&
    !("postPath" in serverGosaki) &&
    !("raw" in serverGosaki) &&
    !("href" in serverGosaki),
);

const mixedInspect = inspectPwdOutput(
  'ftp://user:dummy@example.invalid/\n257 "/" is current directory.\nftp://user:dummy@example.invalid/\n257 "/gosaki-piano" is current directory.\n',
);
assert("mixed file uses last ftp url", mixedInspect.lastLineIsFtpUrl === true);
assert("mixed file lftp pathname is root", mixedInspect.pathnameEqRoot === true);

const guardSrc = fs.readFileSync(GUARD, "utf8");
assert("guard source has no suffix compare", !guardSrc.includes(".endsWith("));
assert("guard source does not log href", !/console\.log\([^)]*href/.test(guardSrc));
assert("guard source does not print pathname labels", !/console\.log\([^)]*pathname/.test(guardSrc));

function runMatchPwdFile(contents, extraArgs = []) {
  const tmp = path.join(os.tmpdir(), `gosaki-pwd-url-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`);
  fs.writeFileSync(tmp, contents, "utf8");
  const extraFiles = [];
  try {
    const args = [GUARD, "--match-pwd-file", tmp];
    for (const extra of extraArgs) {
      const extraPath = path.join(
        os.tmpdir(),
        `gosaki-pwd-extra-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`,
      );
      fs.writeFileSync(extraPath, extra.contents, "utf8");
      extraFiles.push(extraPath);
      args.push(extra.flag, extraPath);
    }
    return spawnSync(process.execPath, args, {
      encoding: "utf8",
      env: { ...process.env, GOSAKI_PRODUCTION_FTP_REMOTE_DIR: "gosaki-piano" },
      cwd: TOOL_ROOT,
    });
  } finally {
    fs.unlinkSync(tmp);
    for (const extraPath of extraFiles) fs.unlinkSync(extraPath);
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

const cliServer = runMatchPwdFile(
  'ftp://user:dummy@example.invalid/\n257 "/" is current directory.\nftp://user:dummy@example.invalid/\n257 "/gosaki-piano" is current directory.\n',
);
const cliServerOut = `${cliServer.stdout ?? ""}${cliServer.stderr ?? ""}`;
assert("cli server parse ok", /server_pwd_parse_ok true/.test(cliServer.stdout ?? ""));
assert("cli server not root", /server_pwd_eq_root false/.test(cliServer.stdout ?? ""));
assert("cli server eq gosaki-piano", /server_pwd_eq_gosaki_piano true/.test(cliServer.stdout ?? ""));
assert("cli server not nested", /server_pwd_nested false/.test(cliServer.stdout ?? ""));
assert("cli server changed", /server_pwd_changed true/.test(cliServer.stdout ?? ""));
assert("cli server pwd_match false", /pwd_match false/.test(cliServer.stdout ?? ""));
assert("cli server does not echo dummy", !cliServerOut.includes("dummy"));
assert("cli server does not echo example.invalid", !cliServerOut.includes("example.invalid"));
assert("cli server does not echo ftp://", !cliServerOut.includes("ftp://"));
assert("cli server does not echo 257 quoted reply", !/257\s+"/.test(cliServerOut));
assert("cli server does not echo pathname", !cliServerOut.includes("/gosaki-piano"));
assert("cli server exit 0 despite lftp url root", cliServer.status === 0);
assert("cli server stdout_has_257_token", /stdout_has_257_token true/.test(cliServer.stdout ?? ""));
assert("cli server parser_candidate_count 2", /parser_candidate_count 2/.test(cliServer.stdout ?? ""));

const cliSplit = runMatchPwdFile("ftp://user:dummy@example.invalid/\n", [
  { flag: "--match-stderr-file", contents: '<--- 257 "/" is current directory.\n' },
  { flag: "--match-quote-file", contents: '257 "/" is current directory.\n' },
  { flag: "--match-quote-file", contents: '257 "/gosaki-piano" is current directory.\n' },
]);
const cliSplitOut = `${cliSplit.stdout ?? ""}${cliSplit.stderr ?? ""}`;
assert("cli split stderr_has_257_token", /stderr_has_257_token true/.test(cliSplit.stdout ?? ""));
assert("cli split stderr_has_lftp_prefix", /stderr_has_lftp_prefix true/.test(cliSplit.stdout ?? ""));
assert("cli split parse ok", /server_pwd_parse_ok true/.test(cliSplit.stdout ?? ""));
assert("cli split eq gosaki-piano", /server_pwd_eq_gosaki_piano true/.test(cliSplit.stdout ?? ""));
assert("cli split changed", /server_pwd_changed true/.test(cliSplit.stdout ?? ""));
assert("cli split does not echo dummy", !cliSplitOut.includes("dummy"));
assert("cli split does not echo pathname", !cliSplitOut.includes("/gosaki-piano"));
assert("cli split does not echo 257 quoted reply", !/257\s+"/.test(cliSplitOut));
assert("cli split exit 0", cliSplit.status === 0);

console.log(`verify-gosaki-production-ftp-remote-dir: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`PASS ${name}`);
for (const name of failures) console.log(`FAIL ${name}`);
if (failures.length > 0) process.exit(1);
