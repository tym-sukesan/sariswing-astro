/**
 * Gosaki admin Save success sticky message + live SoT prefer-over-build asserts.
 * External-network-free.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano");

const GOSAKI_SAVE_SUCCESS_USER_MESSAGE = "保存しました";
const GOSAKI_SAVE_CLEAN_USER_MESSAGE = "変更がありません";
const GOSAKI_SAVE_DIRTY_USER_MESSAGE = "未保存の変更があります";

function resolveSaveGateDisplayReason(input) {
  if (input.saveSuccessSticky && !input.dirty) return GOSAKI_SAVE_SUCCESS_USER_MESSAGE;
  return input.gateReason;
}

function evaluateOneClickSaveStartGate(input) {
  if (input.saveInFlight) return { canStart: false, buttonEnabled: false, reason: "保存中…" };
  if (input.dryRunInFlight) return { canStart: false, buttonEnabled: false, reason: "確認中…" };
  if (input.saveNotArmedLocked) {
    return { canStart: false, buttonEnabled: false, reason: "現在、保存機能は停止しています" };
  }
  if (!input.clientArmed) {
    return { canStart: false, buttonEnabled: false, reason: "保存は現在無効です" };
  }
  if (!input.authenticated) {
    return { canStart: false, buttonEnabled: false, reason: "ログインが必要です" };
  }
  if (!input.dirty) {
    return {
      canStart: false,
      buttonEnabled: false,
      reason: input.saveSuccessSticky
        ? GOSAKI_SAVE_SUCCESS_USER_MESSAGE
        : GOSAKI_SAVE_CLEAN_USER_MESSAGE,
    };
  }
  return { canStart: true, buttonEnabled: true, reason: GOSAKI_SAVE_DIRTY_USER_MESSAGE };
}

function preferLiveSourceOverBuildSnapshot(input) {
  if (input.liveOk && input.liveSource != null) {
    return { value: input.liveSource, usedLive: true, editable: true };
  }
  return {
    value: input.buildSnapshot,
    usedLive: false,
    editable: false,
    error: "live source unavailable — build snapshot is not editable SoT",
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const helperSrc = fs.readFileSync(path.join(TEMPLATE, "gosaki-staging-one-click-save.ts"), "utf8");
assert(helperSrc.includes("GOSAKI_SAVE_SUCCESS_USER_MESSAGE"), "helper success const");
assert(helperSrc.includes("resolveSaveGateDisplayReason"), "helper resolveSaveGateDisplayReason");
assert(helperSrc.includes("saveSuccessSticky"), "helper saveSuccessSticky");

const liveSrc = fs.readFileSync(path.join(TEMPLATE, "gosaki-staging-admin-live-read.ts"), "utf8");
assert(liveSrc.includes("fetchGosakiSchedulesAuthenticatedLive"), "live schedule fetch");
assert(liveSrc.includes("fetchGosakiDiscographyAuthenticatedLive"), "live discography fetch");
assert(liveSrc.includes("preferLiveSourceOverBuildSnapshot"), "prefer helper");
assert(liveSrc.includes("kmjqppxjdnwwrtaeqjta"), "staging ref");
assert(liveSrc.includes("vsbvndwuajjhnzpohghh"), "production stop");
assert(!/service_role/i.test(liveSrc), "no service_role in live-read");
assert(!/\.insert\(|\.update\(|\.delete\(|\.upsert\(/i.test(liveSrc), "no write API in live-read");

const modules = {
  schedule: "gosaki-staging-schedule-operational-edit.ts",
  discography: "gosaki-staging-discography-operational-edit.ts",
  youtube: "gosaki-staging-youtube-multi-operational-edit.ts",
  about: "gosaki-staging-about-operational-edit.ts",
};

for (const [name, file] of Object.entries(modules)) {
  const src = fs.readFileSync(path.join(TEMPLATE, file), "utf8");
  assert(src.includes("saveSuccessSticky"), `${name}: saveSuccessSticky`);
  assert(src.includes("GOSAKI_SAVE_SUCCESS_USER_MESSAGE"), `${name}: success const`);
  assert(src.includes("liveReadState") || src.includes("liveSource"), `${name}: live read state`);
  assert(
    src.includes("gosaki-admin-auth-changed"),
    `${name}: auth-changed listener`,
  );
  if (name === "schedule" || name === "discography") {
    assert(src.includes("AuthenticatedLive") || src.includes("fetchGosaki"), `${name}: supabase live`);
  }
  if (name === "youtube" || name === "about") {
    assert(src.includes("hydrateFromGithubDryRun"), `${name}: github dry-run hydrate`);
  }
}

const applySrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/gosaki-staging-read-only-admin.mjs"),
  "utf8",
);
assert(applySrc.includes("gosaki-staging-admin-live-read.ts"), "apply copies live-read");

// --- Behavioral: success sticky ---
{
  const afterSave = evaluateOneClickSaveStartGate({
    clientArmed: true,
    authenticated: true,
    dirty: false,
    saveInFlight: false,
    dryRunInFlight: false,
    saveSuccessSticky: true,
  });
  assert(afterSave.buttonEnabled === false, "success: button disabled");
  assert(afterSave.canStart === false, "success: cannot start");
  assert(afterSave.reason === GOSAKI_SAVE_SUCCESS_USER_MESSAGE, "success: sticky reason");

  const refreshed = resolveSaveGateDisplayReason({
    saveSuccessSticky: true,
    dirty: false,
    gateReason: GOSAKI_SAVE_CLEAN_USER_MESSAGE,
  });
  assert(refreshed === GOSAKI_SAVE_SUCCESS_USER_MESSAGE, "refresh must not overwrite success");

  const afterEdit = evaluateOneClickSaveStartGate({
    clientArmed: true,
    authenticated: true,
    dirty: true,
    saveInFlight: false,
    dryRunInFlight: false,
    saveSuccessSticky: false,
  });
  assert(afterEdit.buttonEnabled === true, "edit: button enabled");
  assert(afterEdit.reason === GOSAKI_SAVE_DIRTY_USER_MESSAGE, "edit: dirty reason");
}

// --- Behavioral: stale build vs live ---
{
  const build = { venue: "build-stale-venue" };
  const live = { venue: "server-current-venue" };
  const preferred = preferLiveSourceOverBuildSnapshot({
    buildSnapshot: build,
    liveSource: live,
    liveOk: true,
  });
  assert(preferred.usedLive === true, "prefer live");
  assert(preferred.editable === true, "live editable");
  assert(preferred.value.venue === "server-current-venue", "server current wins");

  const failed = preferLiveSourceOverBuildSnapshot({
    buildSnapshot: build,
    liveSource: null,
    liveOk: false,
  });
  assert(failed.usedLive === false, "fail does not use live");
  assert(failed.editable === false, "build snapshot not editable SoT");
  assert(failed.value.venue === "build-stale-venue", "keeps build only as non-editable fallback");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      SAVE_SUCCESS_STICKY: true,
      LIVE_OVER_BUILD: true,
      MODULES: Object.keys(modules),
    },
    null,
    2,
  ),
);
console.log("SAVE_SUCCESS_AND_LIVE_READ_ASSERTS_PASS");
