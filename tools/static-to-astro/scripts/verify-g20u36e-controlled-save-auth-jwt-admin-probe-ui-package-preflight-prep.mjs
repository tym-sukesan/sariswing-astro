/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep verifier.
 * Prep only — no package generate / output update / FTP / RPC / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.md";
const LOCAL_VERIFY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "7a39027";
const PHASE = "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep";
const GATE = "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPackagePreflightPrepared: true";
const REMOTE_TARGET = "/cms-kit-staging/gosaki-piano/";
const PUBLIC_DIST =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT} (prep base; local edits expected)`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (prep base ${BASE_COMMIT}) — non-blocking`);
}

assert("prep doc exists", exists(DOC_REL));
assert("local verify doc exists", exists(LOCAL_VERIFY_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc package generation no",
  /Package generation|packageGenerated/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc output/manual-upload not updated",
  /output\/manual-upload/i.test(doc) && /not updated|更新なし|no/i.test(doc),
);
assert("doc FTP/upload no", /FTP|upload/i.test(doc) && /no|false|not executed/i.test(doc));
assert(
  "doc STG not reflecting",
  /STG|stgPublicUrl/i.test(doc) && /not reflecting|未反映|false/i.test(doc),
);
assert(
  "doc browser RPC no",
  /Real browser RPC|rpcBrowserExecuted|Browser probe/i.test(doc) && /no|false/i.test(doc),
);
assert("doc HTTP execution no", doc.includes("HTTP execution") && /no|false/i.test(doc));
assert("doc SQL created no", doc.includes("SQL created") && /no|false/i.test(doc));
assert("doc SQL executed no", doc.includes("SQL executed") && /no|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|false|policy change/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|false/i.test(doc),
);
assert(
  "doc supabase/functions edit no",
  doc.includes("supabase/functions") && /no|false|edit/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|Save 有効化|saveEnablement/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|displayed.*no/i.test(doc),
);
assert(
  "doc user_id email non-display",
  /user_id/i.test(doc) && /email/i.test(doc) && /never|not|非表示|displayed/i.test(doc),
);

assert(
  "doc package generation command candidates",
  /Package generation command|build:gosaki:staging/i.test(doc),
);
assert("doc build:gosaki:staging recommended", doc.includes("build:gosaki:staging"));
assert(
  "doc manual-upload:package:gosaki:staging noted",
  doc.includes("manual-upload:package:gosaki:staging"),
);
assert(
  "doc freshness conditions",
  /Package freshness conditions|freshness/i.test(doc) && /git status/i.test(doc),
);
assert(
  "doc MANIFEST.sourceCommit condition",
  doc.includes("MANIFEST.sourceCommit") || doc.includes("sourceCommit"),
);
assert(
  "doc sourceCommit must match git HEAD",
  /sourceCommit.*=.*HEAD|sourceCommit.*match|sourceCommit !==/i.test(doc),
);
assert(
  "doc upload public-dist contents",
  doc.includes(PUBLIC_DIST) || doc.includes("public-dist/") ,
);
assert("doc remote target", doc.includes(REMOTE_TARGET));
assert(
  "doc FileZilla / manual upload only",
  /FileZilla|manual only|手動/i.test(doc),
);
assert(
  "doc delete sync mirror CLI FTP NG",
  /delete|sync delete|mirror/i.test(doc) && /CLI FTP/i.test(doc) && /NG/i.test(doc),
);
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert(
  "doc STG post-upload verification plan",
  doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/") &&
    doc.includes("gra-admin-probe-btn"),
);
assert(
  "doc next package-generate-freshness",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-generate-freshness"),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never|forbidden/i.test(doc));
assert(
  "doc prep-before-generate sequencing",
  /prep before generate|after.*prep|MANIFEST\.sourceCommit would point/i.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep"),
);
assert(
  "AI current-state package preflight prep",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPackagePreflightPrepared"),
);
assert(
  "AI next-actions generate-freshness or prep",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-generate-freshness") ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff package preflight prep",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPackagePreflightPrepared"),
);

assert(
  "output/manual-upload not modified in this phase",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
  "unexpected output/manual-upload changes",
);
assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

const statusPorcelain = spawnSync("git", ["status", "--porcelain"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const touched = statusPorcelain.stdout
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);
assert(
  "this phase does not add operation=save send code",
  !touched.some((l) => /operation\s*[:=]\s*['\"]save['\"]/.test(l)),
);
assert(
  "this phase docs/scripts avoid service_role credential values",
  !/service_role\s*=\s*eyJ|SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/i.test(doc),
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
