/**
 * Gosaki production multi-save local contract.
 * Four Supabase Save arms may be true together.
 * Contents+Supabase pairs, unknown arms, and non-boolean armed values fail.
 * Does not deploy, apply SQL, or change Secrets.
 *
 * Run: npm run verify:gosaki-production-multi-save
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MUTEX_REASON, evaluateOperationalClientSaveUiMutex } from "./lib/save-arm-mutex-utils.mjs";
import { evaluateGosakiOperationalClientSaveUiMutexFromEnv } from "./lib/gosaki-operational-save-ui-arm-mutex-gate.mjs";
import { GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS } from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const policy = {
  knownFeatureIds: GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.map((arm) => arm.featureId),
  allowSimultaneousFeatureIds: [
    "gosaki-schedule",
    "gosaki-discography",
    "gosaki-youtube-supabase",
    "gosaki-about-supabase",
  ],
};

function envFor(ids) {
  const env = {};
  for (const arm of GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS) {
    env[arm.clientEnv] = ids.includes(arm.featureId) ? "true" : "false";
  }
  return env;
}

const four = evaluateGosakiOperationalClientSaveUiMutexFromEnv(
  envFor(policy.allowSimultaneousFeatureIds),
);
assert("four supabase arms pass", four.ok === true);
assert("four supabase arms reason", four.reason === MUTEX_REASON.SIMULTANEOUS_OPERATIONAL_SAVE_ARMS);

const ytMix = evaluateGosakiOperationalClientSaveUiMutexFromEnv(
  envFor(["gosaki-youtube-contents", "gosaki-youtube-supabase"]),
);
assert("youtube contents+supabase fail", ytMix.ok === false);
assert("youtube mix reason", ytMix.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS);

const aboutMix = evaluateGosakiOperationalClientSaveUiMutexFromEnv(
  envFor(["gosaki-about-contents", "gosaki-about-supabase"]),
);
assert("about contents+supabase fail", aboutMix.ok === false);
assert("about mix reason", aboutMix.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS);

const unknown = evaluateOperationalClientSaveUiMutex(
  [{ featureId: "not-a-registered-arm", armed: true }],
  policy,
);
assert("unknown arm fail", unknown.ok === false);
assert("unknown arm reason", unknown.reason === MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT);

const nonBoolean = evaluateOperationalClientSaveUiMutex(
  [{ featureId: "gosaki-schedule", armed: "true" }],
  policy,
);
assert("non-boolean arm fail", nonBoolean.ok === false);
assert("non-boolean reason", nonBoolean.reason === MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT);

const admin = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const aboutEdit = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts",
);
const aboutEdge = read("supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts");
const aboutMirror = read(
  "tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts",
);
const bandJson = JSON.parse(
  read("tools/static-to-astro/config/sites/gosaki-piano-band-profiles.json"),
);
const bandIds = bandJson.bands.map((band) => band.id);

const uiFields = [
  "profile-heading",
  "profile-body",
  "profile-image-alt",
  "band-name",
  "band-body",
  "band-image-alt",
];
for (const field of uiFields) {
  assert(`about ui field ${field}`, aboutEdit.includes(`data-gosaki-about-field="${field}"`));
}
for (const key of ["profile.heading", "profile.body", "profile.image_alt", "profile.lede"]) {
  assert(`about client key ${key}`, admin.includes(`"${key}"`));
}
assert("about client band key helper", admin.includes("bands.${stableId}.${part}"));
assert("about edge field_not_allowed", aboutEdge.includes('error: "field_not_allowed"'));
assert("about edge/mirror byte match", aboutEdge === aboutMirror);
for (const id of bandIds) {
  assert(`about edge stable id ${id}`, aboutEdge.includes(`"${id}"`));
  assert(`about client stable id ${id}`, admin.includes(`"${id}"`));
}

const handlers = [
  "supabase/functions/gosaki-schedule-save-dry-run/handler.ts",
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
  "supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts",
  "supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts",
];
for (const rel of handlers) {
  const src = read(rel);
  assert(`${rel} can_write_site`, src.includes("can_write_site"));
  assert(`${rel} gosaki-piano`, src.includes("gosaki-piano"));
  assert(`${rel} no service_role client`, !/SUPABASE_SERVICE_ROLE_KEY/.test(src));
  assert(`${rel} service role disconnected`, src.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
}

const schedule = read("supabase/functions/gosaki-schedule-save-dry-run/handler.ts");
const scheduleMirror = read(
  "tools/static-to-astro/scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
assert("schedule source/mirror byte match", schedule === scheduleMirror);
assert("schedule published in edit fields", /EDIT_SAFE_FIELDS[\s\S]*published/.test(schedule));
assert("schedule create published false", schedule.includes("published") && schedule.includes("false"));
assert(
  "schedule rls template present",
  fs.existsSync(
    path.join(
      REPO_ROOT,
      "tools/static-to-astro/scripts/supabase/cms-core-v2-schedules-site-writer-update-rls.template.sql",
    ),
  ),
);

const youtube = read("supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts");
const youtubeMirror = read(
  "tools/static-to-astro/scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/handler.ts",
);
assert("youtube source/mirror byte match", youtube === youtubeMirror);
assert("youtube delete operation", youtube.includes('DELETE_OPERATION = "delete"'));
assert("youtube sort_order", youtube.includes("sort_order"));
assert("youtube published", youtube.includes("published"));
assert(
  "youtube delete rls template",
  read(
    "tools/static-to-astro/scripts/supabase/cms-core-v2-site-embeds-youtube-delete-rls.template.sql",
  ).includes("site_embeds_admin_delete_youtube"),
);

const workflow = read(".github/workflows/gosaki-piano-production-public-dist.yml");
assert("workflow unsets embed build read", workflow.includes("CMS_KIT_SITE_EMBEDS_BUILD_READ"));
assert("workflow unsets page field build read", workflow.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ"));
assert(
  "workflow does not assign embed build read true",
  !/CMS_KIT_SITE_EMBEDS_BUILD_READ:\s*"true"/.test(workflow),
);
assert(
  "workflow does not assign page field build read true",
  !/CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ:\s*"true"/.test(workflow),
);
assert(
  "workflow does not assign contents youtube arm",
  !/PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED:\s*"true"/.test(workflow),
);
assert(
  "workflow does not assign contents about arm",
  !/PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED:\s*"true"/.test(workflow),
);
assert("workflow unsets service role", workflow.includes("SUPABASE_SERVICE_ROLE_KEY"));

const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const touched = `${changed}\n${untracked}`;
assert(
  "sariswing deploy workflow untouched",
  !/(^|\n)\.github\/workflows\/deploy\.yml(\n|$)/.test(touched) &&
    !/sariswing-.*deploy/i.test(touched),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
