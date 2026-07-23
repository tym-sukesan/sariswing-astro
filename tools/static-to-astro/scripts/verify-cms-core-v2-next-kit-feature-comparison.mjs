/**
 * CMS Core v2 — next Kit feature comparison (planning) verifier.
 * Static checks only — no DB / Edge / Contents / FTP.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-next-kit-feature-comparison.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const DOC = "tools/static-to-astro/docs/cms-core-v2-next-kit-feature-comparison.md";
assert("comparison doc exists", exists(DOC));
const doc = read(DOC);

assert("phase id", doc.includes("cms-core-v2-next-kit-feature-comparison-planning"));
assert("gate comparison complete", /cmsCoreV2NextKitFeatureComparisonComplete:\s*true/.test(doc));
assert("recommended about-supabase", /recommendedNextKitFeature:\s*about-supabase/.test(doc));
assert("ready for about preflight", /readyForAboutSupabaseSlicePreflight:\s*true/.test(doc));
assert("implementation false", /aboutSupabaseImplementationExecuted:\s*false/.test(doc));
assert("implementationExecuted false", /implementationExecuted:\s*false/.test(doc));
assert("db write false", /readyForAnyDbWrite:\s*false/.test(doc));
assert("ftp apply false", /readyForAnyFutureFtpApply:\s*false/.test(doc));
assert("contents about still sot", /contentsAboutStillSot:\s*true/.test(doc));
assert("schedule/discography already supabase", /scheduleDiscographyAlreadySupabase:\s*true/.test(doc));
assert("tenancy reuse", /tenancyReuseSitesSiteMembersPlatformAdmins:\s*true/.test(doc));
assert("verdict recommends About", /RECOMMENDED_NEXT_KIT_FEATURE:\s*About/.test(doc));
assert("no G-12a reuse note", /Do \*\*not\*\* reuse `G-12a-\*`/.test(doc) || /Do not reuse `G-12a-`/.test(doc) || doc.includes("Do **not** reuse `G-12a-*`"));
assert("youtube cutover false retained", /CONTENTS_YOUTUBE_CUTOVER_EXECUTED:\s*false/.test(doc));
assert("mentions sites/site_members/platform_admins", doc.includes("sites") && doc.includes("site_members") && doc.includes("platform_admins"));
assert("mentions Discography Schedule About", doc.includes("Discography") && doc.includes("Schedule") && doc.includes("About"));
assert("mentions Contact Bands", doc.includes("Contact") && doc.includes("Bands"));
assert("staged cutover mirror YouTube", doc.includes("Admin dual-path") && doc.includes("JSON fallback"));
assert("forbidden list", doc.includes("Forbidden in this phase") && doc.includes("implementation"));

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
const gosaki = registry.sites["gosaki-piano"];
assert("registry schedule true", gosaki.supabaseFeatures?.schedule === true);
assert("registry discography true", gosaki.supabaseFeatures?.discography === true);
assert("registry siteEmbeds true", gosaki.supabaseFeatures?.siteEmbeds === true);
assert("registry aboutContent cms true", gosaki.cmsFeatures?.aboutContent === true);
assert(
  "about not in supabaseFeatures yet",
  gosaki.supabaseFeatures?.aboutContent !== true && !("aboutContent" in (gosaki.supabaseFeatures || {})),
);

assert("about json sot exists", exists("tools/static-to-astro/config/sites/gosaki-piano-about-content.json"));
const aboutJson = JSON.parse(read("tools/static-to-astro/config/sites/gosaki-piano-about-content.json"));
assert("about profile block", aboutJson.blocks?.some((b) => b.id === "about-profile-html"));
assert("about bands block", aboutJson.blocks?.some((b) => b.id === "about-bands-html"));

assert("about contents save shared exists", exists("supabase/functions/_shared/gosaki-about-content-save.ts"));
assert(
  "about save still contents path",
  read("supabase/functions/_shared/gosaki-about-content-save.ts").includes("GOSAKI_ABOUT_GITHUB_FILE_PATH"),
);

assert("ADR exists", exists("tools/static-to-astro/docs/cms-core-v2-minimal-architecture-decision.md"));
const adr = read("tools/static-to-astro/docs/cms-core-v2-minimal-architecture-decision.md");
assert("ADR mentions About DB optional", /About DB/i.test(adr));
assert("ADR Phase 3+", /Phase 3\+/.test(adr) || /Phase 3/.test(adr));

const ai00 = read("tools/static-to-astro/docs/ai/00-current-state.md");
const ai03 = read("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoff = read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("ai00 mentions comparison or About next", /next-kit-feature-comparison|About → Supabase|about-supabase/i.test(ai00));
assert("ai03 mentions comparison or About next", /next-kit-feature-comparison|About → Supabase|about-supabase/i.test(ai03));
assert("handoff mentions comparison or About next", /next-kit-feature-comparison|About → Supabase|about-supabase/i.test(handoff));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
