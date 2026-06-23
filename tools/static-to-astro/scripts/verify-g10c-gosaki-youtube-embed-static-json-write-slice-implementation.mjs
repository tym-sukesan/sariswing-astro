/**
 * G-10c — Gosaki YouTube embed static JSON write slice implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g10c-gosaki-youtube-embed-static-json-write-slice-implementation.mjs
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

const doc = read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-write-slice-implementation.md");
const typesSrc = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-types.ts");
const configSrc = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-config.ts");
const guardsSrc = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-guards.ts");
const dryRunSrc = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-dry-run.ts");
const executorSrc = read("src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-executor.ts");
const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-youtube-admin-ui.ts");
const operatorSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro",
);
const apiSrc = read(
  "src/pages/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json.ts",
);
const clientSave = read(
  "src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-client-save.ts",
);
const configJson = read("tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json");

assert("G-10c doc phase", doc.includes("G-10c-gosaki-youtube-embed-static-json-write-slice-implementation"));
assert("implementation complete gate", doc.includes("gosakiYoutubeEmbedStaticJsonWriteSliceImplementationComplete: true"));
assert("dry-run documented", doc.includes("executeG10cYoutubeEmbedStaticJsonWriteDryRun"));
assert("no json write in implementation", doc.includes("cursorExecutedJsonWrite: false"));

assert("target file gosaki youtube json", typesSrc.includes("gosaki-piano-youtube-embed.json"));
assert("target item yt-placeholder-01", typesSrc.includes("yt-placeholder-01"));
assert(
  "allowed fields embedCode published",
  typesSrc.includes('"embedCode", "published"') || typesSrc.includes("'embedCode', 'published'"),
);
assert(
  "approvalId G-10c dedicated",
  typesSrc.includes("G-10c-gosaki-youtube-embed-static-json-write-slice"),
);

assert("default save compile gate false", configSrc.includes("G10C_YOUTUBE_EMBED_SAVE_ENABLED = false"));
assert("provider static-json gate", configSrc.includes('providerRaw !== "static-json"'));
assert("module youtube-embed gate", configSrc.includes('module !== "youtube-embed"'));

assert("dry-run first in dry-run module", dryRunSrc.includes("actualWrite: false"));
assert("guards published requires videoId", guardsSrc.includes("assertG10cYoutubeEmbedPublishedRequiresVideoId"));
assert("path allowlist", guardsSrc.includes("assertG10cYoutubeEmbedConfigPathAllowlisted"));
assert("itemsAffected exactly one", guardsSrc.includes("assertG10cItemsAffectedExactlyOne"));

assert("executor atomic write", executorSrc.includes("atomicWriteJson"));
assert("executor no supabase", !executorSrc.includes("service_role"));

assert("UI dry-run button", operatorSrc.includes("gosaki-yt-g10c-dry-run-btn"));
assert("UI save button default disabled", operatorSrc.includes('id="gosaki-yt-g10c-update-btn"') && operatorSrc.includes("disabled"));
assert("save disabled message", uiSrc.includes("保存は無効です。確認のみ完了しました。"));
assert("save enabled message", uiSrc.includes("保存が有効です。内容を確認し、「更新する」を1回だけ押すとJSONに反映されます。"));

assert("API prerender false", apiSrc.includes("prerender = false"));
assert("API json content-type", apiSrc.includes("application/json"));
assert("client fetch via api module", clientSave.includes("gosaki-youtube-embed-static-json-write-api"));
assert("client uses safe parse", clientSave.includes("parseG10cSaveApiJsonResponse"));
assert("injectRoute dev only", read("astro.config.mjs").includes('command === "dev"'));

assert("no insert delete in doc scope", doc.includes("INSERT / DELETE") && doc.includes("not implemented"));
assert("no migration in doc", doc.includes("site_embeds") && doc.includes("G-10e"));
assert("no deploy in implementation", doc.includes("FTP upload") || doc.includes("manual upload"));

assert("config placeholder unchanged id", configJson.includes("yt-placeholder-01"));

assert("00-current-state G-10c", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10c"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
