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
assert(liveSrc.includes("createGosakiAdminLiveReadSession"), "live session controller");
assert(liveSrc.includes("sameGosakiAdminLiveReadAuthSession"), "auth session dedupe");
assert(liveSrc.includes("gosakiAdminLiveReadAuthFingerprint"), "auth fingerprint");
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
  assert(src.includes("gosaki-admin-auth-changed"), `${name}: auth-changed listener`);
  assert(src.includes("createGosakiAdminLiveReadSession"), `${name}: live session`);
  assert(src.includes("gosakiAdminLiveReadAuthFingerprint"), `${name}: auth fingerprint`);
  assert(src.includes("liveSession.notifyAuth"), `${name}: notifyAuth`);
  assert(
    /EditInitialized === "true"/.test(src) || /Initialized === "true"/.test(src),
    `${name}: once-init guard`,
  );
  if (name === "schedule" || name === "discography") {
    assert(src.includes("AuthenticatedLive") || src.includes("fetchGosaki"), `${name}: supabase live`);
  }
  if (name === "youtube" || name === "about") {
    assert(src.includes("hydrateFromGithubDryRun"), `${name}: github dry-run hydrate`);
  }
}

const adminPageSrc = fs.readFileSync(
  path.join(TEMPLATE, "GosakiStagingReadOnlyAdminPage.astro"),
  "utf8",
);
assert(adminPageSrc.includes("lastAuthDispatchFp"), "auth dispatch dedupe");
assert(adminPageSrc.includes("userId"), "auth detail userId");
assert(adminPageSrc.includes("__gosakiAdminSupabaseClient"), "shared supabase client");
assert(adminPageSrc.includes("TOKEN_REFRESHED"), "token refresh noted");

const applySrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/gosaki-staging-read-only-admin.mjs"),
  "utf8",
);
assert(applySrc.includes("gosaki-staging-admin-live-read.ts"), "apply copies live-read");

const discPanelSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro",
  ),
  "utf8",
);
assert(
  discPanelSrc.includes(":global(.gosaki-discography-content-panel__album-summary)"),
  "disc panel album-summary CSS is global for hydrate",
);
assert(
  discPanelSrc.includes(":global(.gosaki-discography-content-panel__thumb)"),
  "disc panel thumb CSS is global for hydrate",
);
assert(discPanelSrc.includes("grid-template-columns: 72px"), "disc thumb column 72px");
assert(discPanelSrc.includes("width: 72px"), "disc thumb width 72px");
assert(discPanelSrc.includes("grid-template-columns: 56px"), "disc mobile 56px");

const discOpSrc = fs.readFileSync(
  path.join(TEMPLATE, "gosaki-staging-discography-operational-edit.ts"),
  "utf8",
);
assert(discOpSrc.includes("updateDiscographyAlbumCardElement"), "disc in-place card update");
assert(discOpSrc.includes("ensureDiscographyAlbumList"), "disc list ensure");
assert(
  !/list\.innerHTML\s*=\s*albums/.test(discOpSrc),
  "disc hydrate must not full-replace via albums.map innerHTML",
);

const ytPanelSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeContentPanel.astro",
  ),
  "utf8",
);
assert(
  ytPanelSrc.includes(":global(.gosaki-youtube-admin-item)"),
  "youtube item CSS global for hydrate borders",
);

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

// --- Behavioral: live-read once-per-auth-session (no loading loop) ---
{
  function gosakiAdminLiveReadAuthFingerprint(input) {
    if (!input?.signedIn) return "signed-out";
    const userId = String(input.userId ?? "").trim();
    if (userId) return `user:${userId}`;
    const email = String(input.email ?? "").trim();
    if (email) return `email:${email}`;
    return "signed-in:session";
  }
  function isSignedInLiveReadFingerprint(fp) {
    return Boolean(fp) && fp !== "signed-out";
  }
  function sameGosakiAdminLiveReadAuthSession(a, b) {
    if (!a) return false;
    if (a === b) return true;
    if (!isSignedInLiveReadFingerprint(a) || !isSignedInLiveReadFingerprint(b)) return false;
    if (a.startsWith("user:") && b.startsWith("user:")) return a === b;
    return true;
  }
  function createGosakiAdminLiveReadSession(handlers) {
    let phase = "idle";
    let boundAuthFp = null;
    let inFlight = null;
    let fetchCount = 0;
    let generation = 0;
    function setPhase(next, error) {
      phase = next;
      handlers.onPhaseChange(next, error);
    }
    async function runOnce(authFp, force) {
      if (authFp === "signed-out") {
        generation += 1;
        boundAuthFp = null;
        inFlight = null;
        setPhase("idle");
        return;
      }
      if (!force) {
        if (
          (phase === "ready" || phase === "error") &&
          sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp)
        ) {
          return;
        }
        if (
          phase === "loading" &&
          sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp) &&
          inFlight
        ) {
          return inFlight;
        }
      }
      if (!force && handlers.shouldDefer?.()) return;
      if (inFlight && !force) {
        await inFlight;
        if (
          (phase === "ready" || phase === "error") &&
          sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp)
        ) {
          return;
        }
      }
      const myGen = ++generation;
      boundAuthFp = authFp;
      setPhase("loading");
      const work = (async () => {
        fetchCount += 1;
        try {
          const result = await handlers.fetchLive();
          if (myGen !== generation) return;
          if (result.ok) setPhase("ready");
          else setPhase("error", result.error || "err");
        } catch {
          if (myGen !== generation) return;
          setPhase("error", "err");
        } finally {
          if (myGen === generation) inFlight = null;
        }
      })();
      inFlight = work;
      await work;
    }
    return {
      notifyAuth: (fingerprint) => runOnce(String(fingerprint || "signed-out"), false),
      requestManualReload: () =>
        runOnce(
          boundAuthFp && isSignedInLiveReadFingerprint(boundAuthFp)
            ? boundAuthFp
            : "signed-in:session",
          true,
        ),
      getPhase: () => phase,
      getFetchCount: () => fetchCount,
    };
  }

  const phases = [];
  let fetches = 0;
  const session = createGosakiAdminLiveReadSession({
    onPhaseChange: (p) => phases.push(p),
    fetchLive: async () => {
      fetches += 1;
      return { ok: true };
    },
  });
  const fp = gosakiAdminLiveReadAuthFingerprint({ signedIn: true, userId: "u1" });
  await Promise.all([
    session.notifyAuth(fp),
    session.notifyAuth(fp),
    session.notifyAuth(gosakiAdminLiveReadAuthFingerprint({ signedIn: true, email: "a@b.c" })),
  ]);
  assert(fetches === 1, "duplicate auth callbacks → 1 fetch");
  assert(session.getFetchCount() === 1, "session fetchCount 1");
  assert(session.getPhase() === "ready", "phase ready");
  const loadingIdx = phases.lastIndexOf("loading");
  const readyIdx = phases.lastIndexOf("ready");
  assert(loadingIdx >= 0 && readyIdx > loadingIdx, "loading then ready");
  assert(!phases.slice(readyIdx + 1).includes("loading"), "no loading after ready");

  // getSession seed fingerprint then SIGNED_IN user id — still one fetch total
  const session2 = createGosakiAdminLiveReadSession({
    onPhaseChange: () => {},
    fetchLive: async () => ({ ok: true }),
  });
  await session2.notifyAuth(gosakiAdminLiveReadAuthFingerprint({ signedIn: true }));
  await session2.notifyAuth(gosakiAdminLiveReadAuthFingerprint({ signedIn: true, userId: "u9" }));
  assert(session2.getFetchCount() === 1, "seed+SIGNED_IN same session → 1 fetch");

  // UI refresh noise must not restart live-read
  const session3Phases = [];
  const session3 = createGosakiAdminLiveReadSession({
    onPhaseChange: (p) => session3Phases.push(p),
    fetchLive: async () => ({ ok: true }),
  });
  await session3.notifyAuth(fp);
  for (let i = 0; i < 5; i += 1) await session3.notifyAuth(fp);
  assert(session3.getFetchCount() === 1, "repeated notify after ready → still 1");
  assert(!session3Phases.slice(session3Phases.indexOf("ready") + 1).includes("loading"), "no reload loop");

  // error stops without retry loop
  const session4 = createGosakiAdminLiveReadSession({
    onPhaseChange: () => {},
    fetchLive: async () => ({ ok: false, error: "boom" }),
  });
  await session4.notifyAuth(fp);
  await session4.notifyAuth(fp);
  await session4.notifyAuth(fp);
  assert(session4.getPhase() === "error", "error sticky");
  assert(session4.getFetchCount() === 1, "error no retry loop");

  // double init / parallel notify single-flight
  let parallelFetches = 0;
  const session5 = createGosakiAdminLiveReadSession({
    onPhaseChange: () => {},
    fetchLive: async () => {
      parallelFetches += 1;
      await new Promise((r) => setTimeout(r, 5));
      return { ok: true };
    },
  });
  await Promise.all([session5.notifyAuth(fp), session5.notifyAuth(fp), session5.notifyAuth(fp)]);
  assert(parallelFetches === 1, "parallel notify single-flight");

  assert(
    sameGosakiAdminLiveReadAuthSession("signed-in:session", "user:abc") === true,
    "seed matches user fp",
  );
  assert(
    sameGosakiAdminLiveReadAuthSession("user:a", "user:b") === false,
    "different users not same",
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      SAVE_SUCCESS_STICKY: true,
      LIVE_OVER_BUILD: true,
      LIVE_READ_ONCE_PER_SESSION: true,
      MODULES: Object.keys(modules),
    },
    null,
    2,
  ),
);
console.log("SAVE_SUCCESS_AND_LIVE_READ_ASSERTS_PASS");
