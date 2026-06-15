#!/usr/bin/env node
/**
 * Static safety tests for public-dist FTP deployer (G-7f1).
 * No FTP connection.
 */

import {
  assessServerDirPath,
  normalizeRemoteDirForDeploy,
} from "./lib/ftp-remote-dir-safety.mjs";
import {
  buildLftpMirrorScript,
  buildLftpPreflightScript,
  buildLftpLegacyCleanupScript,
} from "./lib/public-dist-ftp-deployer.mjs";

/** @type {Array<{ name: string, fn: () => void }>} */
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

const goodDir = "/cms-kit-staging/gosaki-piano/";

for (const blocked of ["", "/", ".", "./", "~"]) {
  test(`remote dir '${blocked || "(empty)"}' is blocked`, () => {
    if (assessServerDirPath(blocked).ok) throw new Error("expected block");
  });
}

test("remote dir '../' is blocked", () => {
  if (assessServerDirPath("../").ok) throw new Error("expected block");
});

test("remote dir without staging is blocked", () => {
  if (assessServerDirPath("/public/foo/bar/").ok) throw new Error("expected block");
});

test("staging remote dir passes", () => {
  if (!assessServerDirPath(goodDir).ok) throw new Error("expected pass");
});

const preflight = buildLftpPreflightScript({ serverDir: goodDir });
test("preflight contains cmd:fail-exit true", () => {
  if (!preflight.includes("set cmd:fail-exit true")) throw new Error("missing fail-exit");
});
test("preflight contains mkdir", () => {
  if (!/mkdir\s+-f\s+-p/.test(preflight)) throw new Error("missing mkdir");
});
test("preflight contains cd before pwd", () => {
  const cdIdx = preflight.indexOf("cd ");
  const pwdIdx = preflight.indexOf("pwd");
  if (cdIdx < 0 || pwdIdx <= cdIdx) throw new Error("cd must precede pwd");
});
test("preflight does not contain mirror", () => {
  if (preflight.includes("mirror")) throw new Error("preflight must not mirror");
});

const mirrorDefault = buildLftpMirrorScript({
  serverDir: goodDir,
  publicDir: "/tmp/public-dist",
  deleteRemoteExtras: false,
});
test("mirror default has cmd:fail-exit true", () => {
  if (!mirrorDefault.includes("set cmd:fail-exit true")) throw new Error("missing fail-exit");
});
test("mirror default has no --delete", () => {
  if (mirrorDefault.includes("--delete")) throw new Error("--delete must be off by default");
});
test("mirror default cd before mirror", () => {
  const cdIdx = mirrorDefault.indexOf("cd ");
  const mirrorIdx = mirrorDefault.indexOf("mirror ");
  if (cdIdx < 0 || mirrorIdx <= cdIdx) throw new Error("cd must precede mirror");
});
test("mirror default uses newline separation not semicolon chain to mirror", () => {
  const beforeMirror = mirrorDefault.split("mirror ")[0];
  if (beforeMirror.includes("; mirror")) throw new Error("semicolon chain to mirror");
});

const mirrorDelete = buildLftpMirrorScript({
  serverDir: goodDir,
  publicDir: "/tmp/public-dist",
  deleteRemoteExtras: true,
});
test("mirror with deleteRemoteExtras includes --delete", () => {
  if (!mirrorDelete.includes("--delete")) throw new Error("expected --delete");
});

const cleanup = buildLftpLegacyCleanupScript({ serverDir: goodDir });
test("legacy cleanup script has fail-exit and rm", () => {
  if (!cleanup.includes("set cmd:fail-exit true") || !cleanup.includes("rm -r -f public-dist")) {
    throw new Error("missing cleanup guards");
  }
});

test("normalizeRemoteDir strips trailing slash", () => {
  const { withoutTrailing } = normalizeRemoteDirForDeploy(goodDir);
  if (withoutTrailing !== "/cms-kit-staging/gosaki-piano") throw new Error("normalize failed");
});

function main() {
  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      t.fn();
      passed++;
      console.log(`PASS: ${t.name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL: ${t.name} — ${err.message}`);
    }
  }
  console.log(`\n=== public-dist FTP deployer safety: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
