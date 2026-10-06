#!/usr/bin/env node
/**
 * Local verifier for gosaki-admin-deploy-local-implementation (A–D).
 * Source-only. No Edge deploy, Secret set, workflow_dispatch, FTP, DB, or production build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS } from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";
import {
  assessGosakiProductionFtpRemoteDir,
  extractFtp257QuotedPath,
  inspectPwdOutput,
  inspectServerPwdReplies,
  pwdMatchesExpected,
} from "./gosaki-production-ftp-remote-dir-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const WORKFLOW_FILE = "gosaki-piano-production-public-dist.yml";
const WORKFLOW_REL = `.github/workflows/${WORKFLOW_FILE}`;
const SITE_SLUG = "gosaki-piano";
const KMJQ = "kmjqppxjdnwwrtaeqjta";
const VSBVND = "vsbvndwuajjhnzpohghh";

/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const passes = [];

function read(rel, root = REPO_ROOT) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel, root = REPO_ROOT) {
  return fs.existsSync(path.join(root, rel));
}

function assert(name, condition, detail = "") {
  if (condition) {
    passes.push(name);
    return;
  }
  failures.push(detail ? `${name}: ${detail}` : name);
}

function byteEq(aRel, bRel) {
  const a = fs.readFileSync(path.join(REPO_ROOT, aRel));
  const b = fs.readFileSync(path.join(REPO_ROOT, bRel));
  return a.equals(b);
}

const sariswingDeployFiles = [
  ".github/workflows/deploy.yml",
  "supabase/functions/trigger-deploy/index.ts",
  "supabase/functions/deploy-status/index.ts",
  "src/components/admin/AdminDeployBar.astro",
  "src/scripts/admin/deploy-trigger.ts",
  "src/lib/admin/deploy-api.ts",
];

const workflow = exists(WORKFLOW_REL) ? read(WORKFLOW_REL) : "";
assert("workflow file exists", exists(WORKFLOW_REL));
assert("workflow_dispatch", workflow.includes("workflow_dispatch"));
assert("main ref required", workflow.includes('refs/heads/main'));
assert("gosaki-only name", workflow.includes("Gosaki piano production public-dist"));
assert("concurrency group gosaki", workflow.includes("gosaki-piano-production-deploy"));
assert("build:gosaki:production", workflow.includes("build:gosaki:production"));
assert("tracked fixture preflight", workflow.includes("gosaki-production-fixture-preflight.mjs"));
assert("preflight before lftp", workflow.indexOf("gosaki-production-fixture-preflight.mjs") < workflow.indexOf("lftp"));
assert("workflow does not crawl", !/crawl-static-site|--run-crawl/.test(workflow));
assert("tools/static-to-astro working dir", workflow.includes("working-directory: tools/static-to-astro"));
assert("GOSAKI_PRODUCTION_SUPABASE_URL", workflow.includes("GOSAKI_PRODUCTION_SUPABASE_URL"));
assert("GOSAKI_PRODUCTION_SUPABASE_ANON_KEY", workflow.includes("GOSAKI_PRODUCTION_SUPABASE_ANON_KEY"));
assert("kmjq URL required", workflow.includes(KMJQ));
assert("vsbvnd STOP in workflow", workflow.includes(VSBVND));
assert("Save arms unset", workflow.includes("PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED"));
assert("public-dist exists check", workflow.includes("public-dist"));
assert("lftp", /\blftp\b/.test(workflow));
assert("mirror -R", workflow.includes("mirror -R"));
assert("no --delete", !workflow.includes("--delete"));
assert("no --allow-delete", !workflow.includes("--allow-delete"));
assert("no LOLIPOP_FTP_*", !/LOLIPOP_FTP_/.test(workflow));
assert("no GOSAKI_STAGING_FTP_*", !/GOSAKI_STAGING_FTP_/.test(workflow));
assert("uses GOSAKI_PRODUCTION_FTP_*", workflow.includes("GOSAKI_PRODUCTION_FTP_REMOTE_DIR"));
assert("cd after connect", workflow.includes('cd "${GOSAKI_PRODUCTION_FTP_REMOTE_DIR}"'));
assert("remote dir guard script", workflow.includes("gosaki-production-ftp-remote-dir-guard.mjs"));
assert("old pwd diagnostic step removed", !workflow.includes("Read-only FTP relative path"));
assert("temporary dry-run step removed", !workflow.includes("Temporary lftp mirror -R dry-run"));
assert("no --dry-run", !workflow.includes("--dry-run"));
assert("no quote PWD diagnostic", !/quote\s+PWD\b/.test(workflow));
assert("no pwd -p", !workflow.includes("pwd -p"));
assert("no match-pwd-file", !workflow.includes("--match-pwd-file"));
assert("upload if false absent", !workflow.includes("if: ${{ false }}"));

const UPLOAD_STEP = "- name: Upload public-dist via lftp mirror -R (delete disabled)";
const uploadStart = workflow.indexOf(UPLOAD_STEP);
const lftpInstall = workflow.indexOf("- name: Install lftp");
const uploadStep = uploadStart >= 0 ? workflow.slice(uploadStart) : "";
assert("upload step present", uploadStart >= 0);
assert("upload after lftp install", lftpInstall >= 0 && uploadStart > lftpInstall);
assert("upload step enabled", uploadStep.length > 0 && !/^\s+if:/m.test(uploadStep));
assert("upload set +x", uploadStep.includes("set +x"));
assert("upload no set -x", !/set -x/.test(uploadStep));
assert("upload unquoted heredoc", uploadStep.includes("<<EOF") && !uploadStep.includes("<<'EOF'"));
assert("upload runs remote-dir guard", uploadStep.includes("node scripts/gosaki-production-ftp-remote-dir-guard.mjs"));
assert("upload cmd fail-exit", uploadStep.includes("set cmd:fail-exit true"));
assert("upload ssl-allow no", uploadStep.includes("set ftp:ssl-allow no"));
assert("upload passive-mode", uploadStep.includes("set ftp:passive-mode on"));
assert("upload max-retries", uploadStep.includes("set net:max-retries 5"));
assert("upload timeout", uploadStep.includes("set net:timeout 30"));
assert("upload clobber", uploadStep.includes("set xfer:clobber on"));
assert("upload cd remote dir", uploadStep.includes('cd "${GOSAKI_PRODUCTION_FTP_REMOTE_DIR}"'));
assert(
  "upload lcd public-dist",
  uploadStep.includes("lcd output/manual-upload/gosaki-piano-production/public-dist/"),
);
assert("upload mirror -R", /^\s+mirror -R\b/m.test(uploadStep));
assert("upload no --dry-run", !uploadStep.includes("--dry-run"));
assert("upload parallel", uploadStep.includes("--parallel=3"));
assert("upload exclude ftpaccess", uploadStep.includes("--exclude-glob .ftpaccess"));
assert("upload exclude welcome", uploadStep.includes("--exclude-glob welcome.html"));
assert("upload exclude htaccess", uploadStep.includes("--exclude-glob .htaccess"));
assert("upload no --delete", !uploadStep.includes("--delete") && !uploadStep.includes("--allow-delete"));
assert("upload no pwd", !/^\s+pwd\b/m.test(uploadStep));
assert("upload no quote", !/^\s+quote\b/m.test(uploadStep));
assert("upload no cls", !/^\s+cls\b/m.test(uploadStep));
assert("upload no ls", !/^\s+ls\b/m.test(uploadStep));
assert("upload no debug", !/\bdebug\b/i.test(uploadStep));
assert("upload no LOLIPOP", !/LOLIPOP_FTP_/.test(uploadStep));
assert("upload no staging ftp secrets", !/GOSAKI_STAGING_FTP_/.test(uploadStep));
assert("upload no echo secrets", !/echo\s+["']?\$\{?GOSAKI_PRODUCTION_FTP_/.test(uploadStep));
assert("upload no printenv", !/printenv|env\s*\|/.test(uploadStep));
assert("upload gosaki host secret name only", uploadStep.includes("GOSAKI_PRODUCTION_FTP_HOST"));
assert("upload gosaki user secret name only", uploadStep.includes("GOSAKI_PRODUCTION_FTP_USER"));
assert("upload gosaki password secret name only", uploadStep.includes("GOSAKI_PRODUCTION_FTP_PASSWORD"));
assert("upload gosaki remote dir secret name only", uploadStep.includes("GOSAKI_PRODUCTION_FTP_REMOTE_DIR"));
const uploadMirrors = [...uploadStep.matchAll(/^\s*mirror\b.*$/gm)].map((match) => match[0].trim());
assert(
  "one upload mirror",
  uploadMirrors.length === 1 &&
    uploadMirrors[0] ===
      "mirror -R --verbose --parallel=3 --exclude-glob .ftpaccess --exclude-glob welcome.html --exclude-glob .htaccess ./",
);
assert("upload single lftp session", (uploadStep.match(/\blftp -u\b/g) || []).length === 1);
assert("no service_role in workflow", !/SERVICE_ROLE/.test(workflow) || workflow.includes("unset") && workflow.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert("contents: read only", workflow.includes("contents: read"));
assert("no Contents write permission", !/contents:\s*write/.test(workflow));

const rootRejected = assessGosakiProductionFtpRemoteDir("/");
const emptyRejected = assessGosakiProductionFtpRemoteDir("");
const dotRejected = assessGosakiProductionFtpRemoteDir(".");
const parentRejected = assessGosakiProductionFtpRemoteDir("../");
const okDir = assessGosakiProductionFtpRemoteDir("/home/users/2/example/web/gosaki");
assert("guard rejects /", rootRejected.ok === false);
assert("guard rejects empty", emptyRejected.ok === false);
assert("guard rejects .", dotRejected.ok === false);
assert("guard rejects ../", parentRejected.ok === false);
assert("guard accepts nested dir", okDir.ok === true);
assert(
  "pwd match helper nested exact",
  okDir.ok && pwdMatchesExpected(`${okDir.normalized}\n`, okDir.normalized),
);
assert(
  "relative expected matches absolute pwd",
  pwdMatchesExpected("/gosaki-piano\n", "gosaki-piano"),
);
assert(
  "relative expected matches relative pwd",
  pwdMatchesExpected("gosaki-piano\n", "gosaki-piano"),
);
assert("relative expected rejects root pwd", pwdMatchesExpected("/\n", "gosaki-piano") === false);
assert("relative expected rejects dot pwd", pwdMatchesExpected(".\n", "gosaki-piano") === false);
assert(
  "relative expected rejects not-gosaki-piano",
  pwdMatchesExpected("/not-gosaki-piano\n", "gosaki-piano") === false,
);
assert(
  "relative expected rejects nested lookalike",
  pwdMatchesExpected("/foo/gosaki-piano\n", "gosaki-piano") === false,
);
assert(
  "multi-segment expected still exact-only",
  pwdMatchesExpected("/home/users/2/example/web/gosaki\n", "/home/users/2/example/web/gosaki"),
);
assert(
  "multi-segment expected rejects relative basename",
  pwdMatchesExpected("gosaki\n", "/home/users/2/example/web/gosaki") === false,
);
assert(
  "ftp url host-only matches relative expected",
  pwdMatchesExpected("ftp://example.invalid/gosaki-piano\n", "gosaki-piano"),
);
assert(
  "ftp url user matches relative expected",
  pwdMatchesExpected("ftp://user@example.invalid/gosaki-piano\n", "gosaki-piano"),
);
assert(
  "ftp url dummy-pass matches relative expected",
  pwdMatchesExpected("ftp://user:dummy@example.invalid/gosaki-piano\n", "gosaki-piano"),
);
assert(
  "ftp url root rejected",
  pwdMatchesExpected("ftp://example.invalid/\n", "gosaki-piano") === false,
);
assert(
  "ftp url not-gosaki-piano rejected",
  pwdMatchesExpected("ftp://example.invalid/not-gosaki-piano\n", "gosaki-piano") === false,
);
assert(
  "ftp url nested lookalike rejected",
  pwdMatchesExpected("ftp://example.invalid/foo/gosaki-piano\n", "gosaki-piano") === false,
);
assert(
  "ftp url malformed rejected",
  pwdMatchesExpected("ftp://[\n", "gosaki-piano") === false,
);
assert(
  "ftp url does not partial-match",
  pwdMatchesExpected("ftp://example.invalid/xxgosaki-piano\n", "gosaki-piano") === false,
);
assert(
  "ftp url multi-segment expected still exact",
  pwdMatchesExpected(
    "ftp://example.invalid/home/users/2/example/web/gosaki\n",
    "/home/users/2/example/web/gosaki",
  ),
);
const urlInspect = inspectPwdOutput("ftp://user:dummy@example.invalid/gosaki-piano\n");
assert("ftp inspect has no credential fields", !("username" in urlInspect) && !("password" in urlInspect) && !("host" in urlInspect) && !("href" in urlInspect));
assert("ftp inspect path is pathname only", urlInspect.path === "/gosaki-piano");
assert("257 parser gosaki-piano", extractFtp257QuotedPath('257 "/gosaki-piano" is current directory.') === "/gosaki-piano");
assert("257 parser escaped quote", extractFtp257QuotedPath('257 "/foo""bar"') === '/foo"bar');
assert("257 parser malformed", extractFtp257QuotedPath("257 /gosaki-piano") === null);
assert("257 parser prefixed", extractFtp257QuotedPath('<--- 257 "/gosaki-piano" is current directory.') === "/gosaki-piano");
assert("257 parser 257- line", extractFtp257QuotedPath('257-"/gosaki-piano"') === "/gosaki-piano");
const serverInspect = inspectServerPwdReplies(
  '257 "/" is current directory.\n257 "/gosaki-piano" is current directory.\n',
  "gosaki-piano",
);
assert("server pwd parse ok", serverInspect.parseOk === true);
assert("server pwd eq gosaki-piano", serverInspect.eqGosakiPiano === true);
assert("server pwd not nested", serverInspect.nested === false);
assert("server pwd changed", serverInspect.changed === true);
assert("server pwd inspect has no path fields", !("path" in serverInspect) && !("raw" in serverInspect));
assert("upload remains enabled", !workflow.includes("if: ${{ false }}"));
assert("matcher source has no suffix compare", !read("tools/static-to-astro/scripts/gosaki-production-ftp-remote-dir-guard.mjs").includes(".endsWith("));

const triggerHandler = read("supabase/functions/gosaki-production-deploy-trigger/handler.ts");
const statusHandler = read("supabase/functions/gosaki-production-deploy-status/handler.ts");
const authShared = read("supabase/functions/_shared/gosaki-production-deploy-auth.ts");
const triggerIndex = read("supabase/functions/gosaki-production-deploy-trigger/index.ts");
const statusIndex = read("supabase/functions/gosaki-production-deploy-status/index.ts");
const configToml = read("supabase/config.toml");

assert("trigger handler exists", exists("supabase/functions/gosaki-production-deploy-trigger/handler.ts"));
assert("status handler exists", exists("supabase/functions/gosaki-production-deploy-status/handler.ts"));
assert("workflow hardcoded in auth", authShared.includes(`WORKFLOW_FILE = "${WORKFLOW_FILE}"`));
assert("ref main hardcoded", authShared.includes('DISPATCH_REF = "main"'));
assert("site_slug gosaki-piano", authShared.includes(`SITE_SLUG = "${SITE_SLUG}"`));
assert("can_write_site used", authShared.includes('rpc("can_write_site"') || authShared.includes("rpc('can_write_site'"));
assert("trigger can_write_site via authorize", triggerHandler.includes("authorizeGosakiProductionDeploy"));
assert("status can_write_site via authorize", statusHandler.includes("authorizeGosakiProductionDeploy"));
assert("trigger no requireAdminUser", !triggerHandler.includes("requireAdminUser") && !triggerIndex.includes("requireAdminUser"));
assert("status no requireAdminUser", !statusHandler.includes("requireAdminUser") && !statusIndex.includes("requireAdminUser"));
assert("auth no requireAdminUser", !authShared.includes("requireAdminUser"));
assert("no getGitHubConfig", !authShared.includes("getGitHubConfig") && !triggerHandler.includes("getGitHubConfig"));
assert("client cannot set workflow", authShared.includes("FORBIDDEN_CLIENT_KEYS") && authShared.includes('"workflow"'));
assert("trigger rejects client workflow/ref/repo", triggerHandler.includes("rejectForbiddenClientFields"));
assert("status rejects client workflow/ref/repo", statusHandler.includes("rejectForbiddenClientFields"));
assert("Deploy arm exact true", triggerHandler.includes('String(env.deployArmed ?? "") !== "true"'));
assert("status does not require Deploy arm for poll", !statusHandler.includes("deploy_not_armed"));
assert("vsbvnd STOP", authShared.includes(VSBVND) && authShared.includes("PRODUCTION_REF_STOP"));
assert("kmjq required", authShared.includes(KMJQ));
assert("GITHUB_REPO from secret/env not client", authShared.includes("githubRepo") && triggerIndex.includes('Deno.env.get("GITHUB_REPO")'));
assert("config.toml trigger verify_jwt", /\[functions\.gosaki-production-deploy-trigger\][\s\S]*verify_jwt = true/.test(configToml));
assert("config.toml status verify_jwt", /\[functions\.gosaki-production-deploy-status\][\s\S]*verify_jwt = true/.test(configToml));
assert("no service_role connected", authShared.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));

const toolsAuth = "tools/static-to-astro/scripts/edge-functions/_shared/gosaki-production-deploy-auth.ts";
const toolsTrigger = "tools/static-to-astro/scripts/edge-functions/gosaki-production-deploy-trigger/handler.ts";
const toolsStatus = "tools/static-to-astro/scripts/edge-functions/gosaki-production-deploy-status/handler.ts";
assert("tools auth byte-eq", byteEq("supabase/functions/_shared/gosaki-production-deploy-auth.ts", toolsAuth));
assert("tools trigger handler byte-eq", byteEq("supabase/functions/gosaki-production-deploy-trigger/handler.ts", toolsTrigger));
assert("tools status handler byte-eq", byteEq("supabase/functions/gosaki-production-deploy-status/handler.ts", toolsStatus));
assert(
  "tools trigger index byte-eq",
  byteEq(
    "supabase/functions/gosaki-production-deploy-trigger/index.ts",
    "tools/static-to-astro/scripts/edge-functions/gosaki-production-deploy-trigger/index.ts",
  ),
);
assert(
  "tools status index byte-eq",
  byteEq(
    "supabase/functions/gosaki-production-deploy-status/index.ts",
    "tools/static-to-astro/scripts/edge-functions/gosaki-production-deploy-status/index.ts",
  ),
);

const operatorHome = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro",
  REPO_ROOT,
);
const deployBar = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiProductionDeployBar.astro",
  REPO_ROOT,
);
const deployTs = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-production-deploy.ts",
  REPO_ROOT,
);
const adminPage = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
  REPO_ROOT,
);
const applyLib = read("tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs", REPO_ROOT);
const inventory = read("tools/static-to-astro/scripts/lib/gosaki-operational-save-ui-arm-inventory.mjs", REPO_ROOT);

assert("OperatorHome includes DeployBar", operatorHome.includes("AdminGosakiProductionDeployBar"));
assert("Deploy button data attr", deployBar.includes('data-gosaki-production-deploy="true"'));
assert("unarmed reason visible", deployBar.includes("Deploy 未武装"));
assert("Save vs Deploy copy", deployBar.includes("Save とは別操作") || deployBar.includes("保存ボタンではありません"));
assert("polling 12s", deployTs.includes("12_000") || deployTs.includes("12000"));
assert("double-run lock", deployTs.includes("deployInFlight"));
assert("portal-only init", adminPage.includes('dataset.gosakiAdminPage === "portal"'));
assert("portal-only OperatorHome", /page === "portal"[\s\S]*AdminGosakiStagingOperatorHome/.test(adminPage));
assert("deploy dataset on body", adminPage.includes("data-gosaki-production-deploy-armed"));
assert("apply copies DeployBar", applyLib.includes("AdminGosakiProductionDeployBar.astro"));
assert("apply copies deploy ts", applyLib.includes("gosaki-production-deploy.ts"));

const contentPanels = [
  "AdminGosakiStagingScheduleContentPanel.astro",
  "AdminGosakiStagingAboutContentPanel.astro",
  "AdminGosakiStagingDiscographyContentPanel.astro",
  "AdminGosakiStagingYoutubeContentPanel.astro",
];
for (const name of contentPanels) {
  const src = read(`tools/static-to-astro/templates/admin-cms/gosaki/components/${name}`, REPO_ROOT);
  assert(`${name} has no DeployBar`, !src.includes("AdminGosakiProductionDeployBar"));
}

assert(
  "Deploy arm not in Save inventory",
  !GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.some(
    (arm) => arm.clientEnv === "PUBLIC_GOSAKI_PRODUCTION_DEPLOY_UI_ARMED",
  ),
);
assert(
  "inventory source omits Deploy env",
  !inventory.includes("PUBLIC_GOSAKI_PRODUCTION_DEPLOY_UI_ARMED"),
);
assert("client Deploy vsbvnd STOP", deployTs.includes(VSBVND));
assert("trigger/status function names fixed", deployTs.includes("gosaki-production-deploy-trigger") && deployTs.includes("gosaki-production-deploy-status"));
assert("client does not send workflow", !/JSON\.stringify\(\{[\s\S]*workflow/.test(deployTs) && deployTs.includes("JSON.stringify(body)"));
assert("empty trigger body", deployTs.includes("GOSAKI_PRODUCTION_DEPLOY_TRIGGER_NAME") && deployTs.includes("{},"));

const srcAdminPages = path.join(REPO_ROOT, "src/pages/admin");
let srcAdminHasGosakiDeploy = false;
if (fs.existsSync(srcAdminPages)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(astro|ts|js)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        if (text.includes("AdminGosakiProductionDeployBar") || text.includes("gosaki-production-deploy")) {
          srcAdminHasGosakiDeploy = true;
        }
      }
    }
  };
  walk(srcAdminPages);
}
assert("src/pages/admin has no Gosaki Deploy UI", srcAdminHasGosakiDeploy === false);

for (const rel of sariswingDeployFiles) {
  assert(`sariswing file present ${rel}`, exists(rel));
}
const deployYml = read(".github/workflows/deploy.yml");
const triggerDeploy = read("supabase/functions/trigger-deploy/index.ts");
const deployStatus = read("supabase/functions/deploy-status/index.ts");
assert("Sariswing deploy.yml still LOLIPOP", /LOLIPOP_FTP_/.test(deployYml));
assert("Sariswing trigger-deploy still requireAdminUser", triggerDeploy.includes("requireAdminUser"));
assert("Sariswing deploy-status still requireAdminUser", deployStatus.includes("requireAdminUser"));
assert("Sariswing AdminDeployBar unchanged id", read("src/components/admin/AdminDeployBar.astro").includes('id="triggerDeploy"'));

const pkg = JSON.parse(read("tools/static-to-astro/package.json", REPO_ROOT));
assert(
  "npm verify:gosaki-production-deploy",
  pkg.scripts && pkg.scripts["verify:gosaki-production-deploy"] === "node scripts/verify-gosaki-production-deploy.mjs",
);
assert(
  "npm verify:gosaki-production-ci-fixture",
  pkg.scripts &&
    pkg.scripts["verify:gosaki-production-ci-fixture"] ===
      "node scripts/verify-gosaki-production-ci-fixture.mjs",
);
assert(
  "npm verify:gosaki-production-ftp-remote-dir",
  pkg.scripts &&
    pkg.scripts["verify:gosaki-production-ftp-remote-dir"] ===
      "node scripts/verify-gosaki-production-ftp-remote-dir.mjs",
);

console.log(`verify-gosaki-production-deploy: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`PASS ${name}`);
for (const name of failures) console.log(`FAIL ${name}`);
if (failures.length > 0) process.exit(1);
