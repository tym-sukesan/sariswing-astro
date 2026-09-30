#!/usr/bin/env node
/**
 * Gosaki production FTP remote-dir guard + pwd matcher cases.
 * No FTP connect.
 */

import {
  assessGosakiProductionFtpRemoteDir,
  pwdMatchesExpected,
} from "./gosaki-production-ftp-remote-dir-guard.mjs";

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

console.log(`verify-gosaki-production-ftp-remote-dir: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`PASS ${name}`);
for (const name of failures) console.log(`FAIL ${name}`);
if (failures.length > 0) process.exit(1);
