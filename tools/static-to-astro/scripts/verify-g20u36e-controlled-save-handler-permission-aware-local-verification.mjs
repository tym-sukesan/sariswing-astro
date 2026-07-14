/**
 * G-20u36e-controlled-save-handler-permission-aware-local-verification verifier.
 * Local verification record only — no Edge deploy / Save / HTTP / DB write.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-handler-permission-aware-local-verification.md";
const IMPL_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-handler-permission-aware-local-implementation.md";
const HANDLER_REL =
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const INDEX_REL =
  "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const PHASE =
  "G-20u36e-controlled-save-handler-permission-aware-local-verification";
const GATE =
  "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalVerified: true";
const NEXT = "G-20u36e-controlled-save-edge-deploy-prep";

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

function braceBalanceOk(src) {
  let curly = 0;
  let paren = 0;
  let square = 0;
  let inS = false;
  let inD = false;
  let inT = false;
  let escape = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && (inS || inD || inT)) {
      escape = true;
      continue;
    }
    if (!inD && !inT && ch === "'" ) {
      inS = !inS;
      continue;
    }
    if (!inS && !inT && ch === '"') {
      inD = !inD;
      continue;
    }
    if (!inS && !inD && ch === "`") {
      inT = !inT;
      continue;
    }
    if (inS || inD || inT) continue;
    if (ch === "{") curly += 1;
    if (ch === "}") curly -= 1;
    if (ch === "(") paren += 1;
    if (ch === ")") paren -= 1;
    if (ch === "[") square += 1;
    if (ch === "]") square -= 1;
    if (curly < 0 || paren < 0 || square < 0) return false;
  }
  return curly === 0 && paren === 0 && square === 0;
}

assert("local verification doc exists", exists(DOC_REL));
assert("local implementation doc exists", exists(IMPL_DOC_REL));
assert("handler.ts exists", exists(HANDLER_REL));
assert("index.ts exists", exists(INDEX_REL));

const doc = read(DOC_REL);
const handler = read(HANDLER_REL);
const index = read(INDEX_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc local verification only",
  /Local verification only|localVerificationOnly:\s*true/i.test(doc),
);
assert(
  "doc Edge deployなし",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "doc DB write未実行",
  /DB write executed.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert(
  "doc Authorization転送確認",
  /Authorization forwarded|authorizationHeader/i.test(doc),
);
assert(
  "doc user-JWT client確認",
  /user-JWT client|createUserJwtSupabaseClient|SUPABASE_ANON_KEY/i.test(doc),
);
assert("doc is_admin確認", /is_admin/i.test(doc));
assert(
  "doc controlled gate確認",
  /controlled gate|approvalId\/sliceId/i.test(doc),
);
assert("doc title-only UPDATE確認", /title-only UPDATE/i.test(doc));
assert(
  "doc no insert/delete/rebuild確認",
  /no insert\/delete\/rebuild/i.test(doc),
);
assert(
  "doc no token/user response確認",
  /no JWT \/ user_id \/ email|JWT\/user_id\/email/i.test(doc),
);
assert("doc next edge deploy prep", doc.includes(NEXT));
assert(
  "doc deno skipped or recorded",
  /denoCheck:\s*skipped|deno.*not installed|deno check/i.test(doc),
);
assert("doc diff review PASS", /Diff review results \(PASS\)|Review item/i.test(doc));
assert(
  "doc verifier strengthening recorded",
  /Verifier strengthening|Strengthened/i.test(doc),
);

assert("static brace-balance handler.ts", braceBalanceOk(handler));
assert("static brace-balance index.ts", braceBalanceOk(index));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-handler-permission-aware-local-verification",
  ),
);
assert(
  "AI current-state local verification",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalVerified",
    ),
);
assert(
  "AI next-actions edge deploy prep or local verification",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff local verification",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalVerified",
    ),
);

assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36e-controlled-save-handler-permission-aware-local-verification: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
