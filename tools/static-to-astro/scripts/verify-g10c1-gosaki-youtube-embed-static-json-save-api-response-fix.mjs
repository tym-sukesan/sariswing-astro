/**
 * G-10c1 — Gosaki YouTube embed Save API response fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g10c1-gosaki-youtube-embed-static-json-save-api-response-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const doc = read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-save-api-response-fix.md");
const astroConfig = read("astro.config.mjs");
const apiModule = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-api.ts");
const clientSave = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-client-save.ts");
const apiRoute = read(
  "src/pages/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json.ts",
);

const apiPath =
  "/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json";

assert("G-10c1 doc phase", doc.includes("G-10c1-gosaki-youtube-embed-static-json-save-api-response-fix"));
assert("incident documented", doc.includes("<!doctype"));
assert("root cause injectRoute", doc.includes("injectRoute"));
assert("FailedToLoadModuleSSR documented", doc.includes("FailedToLoadModuleSSR"));
assert("import path fix documented", doc.includes("../../../../lib/admin"));
assert("fix complete gate", doc.includes("gosakiYoutubeEmbedStaticJsonSaveApiResponseFixComplete: true"));
assert("SSR load fix gate", doc.includes("gosakiYoutubeEmbedStaticJsonSaveApiSsrLoadFixComplete: true"));

assert("injectRoute dev only", astroConfig.includes('command === "dev"'));
assert(
  "injectRoute entrypoint json.ts",
  astroConfig.includes("youtube-embed-static-json-write.json.ts"),
);

assert("shared API path constant", apiModule.includes(apiPath));
assert("parse helper exists", apiModule.includes("parseG10cSaveApiJsonResponse"));
assert("non-json operator message", apiModule.includes("保存APIからJSON以外の応答が返りました"));
assert("html detection", apiModule.includes("<!doctype"));

assert("client uses parse helper", clientSave.includes("parseG10cSaveApiJsonResponse"));
assert("client no bare response.json", !clientSave.includes("response.json()"));
assert("client fetch path via api module", clientSave.includes("gosaki-youtube-embed-static-json-write-api"));
assert("client Accept json", clientSave.includes('Accept: "application/json"'));

assert("api json content-type", apiRoute.includes("application/json; charset=utf-8"));
assert("api GET json 405", apiRoute.includes("method_not_allowed"));
assert("api POST export", apiRoute.includes("export const POST"));
assert("API import path depth", apiRoute.includes('from "../../../../lib/admin/staging-write/'));
assert("API no wrong import depth", !apiRoute.includes("../../../../../lib/admin/"));
assert("GET returns error field", apiRoute.includes('error: "method_not_allowed"'));

assert("00-current-state G-10c1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10c1"));

const jsonDiff = spawnSync(
  "git",
  ["diff", "--", "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("youtube JSON config unchanged", jsonDiff.stdout.trim() === "");

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
