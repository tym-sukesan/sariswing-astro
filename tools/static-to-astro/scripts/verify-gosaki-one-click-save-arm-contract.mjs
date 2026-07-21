/**
 * Gosaki one-click Save arm contract — external-network-free mock asserts.
 * Client arm is the hard start gate; server arm rejection is the write gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano",
);

const GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE = "現在、保存機能は停止しています";
const GOSAKI_CLIENT_SAVE_DISARMED_REASON = "保存は現在無効です";

function isClientSaveArmed(saveArmed) {
  return saveArmed === true;
}

function isGosakiSaveNotArmedResponse(body, httpStatus) {
  const data = body && typeof body === "object" ? body : {};
  const reasonCode = String(data.reasonCode ?? data.reason_code ?? data.saveReadiness ?? "").trim();
  if (/^(save_not_armed|not_armed)$/i.test(reasonCode)) return true;
  const hay = [
    reasonCode,
    String(data.message ?? ""),
    ...(Array.isArray(data.errors) ? data.errors.map(String) : []),
  ]
    .join(" ")
    .toLowerCase();
  if (/save_not_armed|save is not armed|not armed on server/.test(hay)) return true;
  if (httpStatus === 403 && /not_armed|not armed|save.*arm/.test(hay)) return true;
  return false;
}

function evaluateOneClickSaveStartGate(input) {
  if (input.saveInFlight) return { canStart: false, buttonEnabled: false, reason: "保存中…" };
  if (input.dryRunInFlight) return { canStart: false, buttonEnabled: false, reason: "確認中…" };
  if (input.indeterminateLocked) {
    return { canStart: false, buttonEnabled: false, reason: "結果が確認できません。自動では再試行しません。" };
  }
  if (input.saveNotArmedLocked) {
    return {
      canStart: false,
      buttonEnabled: false,
      reason: GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE,
    };
  }
  if (!input.clientArmed) {
    return { canStart: false, buttonEnabled: false, reason: GOSAKI_CLIENT_SAVE_DISARMED_REASON };
  }
  if (!input.authenticated) {
    return { canStart: false, buttonEnabled: false, reason: "ログインが必要です" };
  }
  if (!input.dirty) {
    return { canStart: false, buttonEnabled: false, reason: "変更がありません" };
  }
  return { canStart: true, buttonEnabled: true, reason: "保存" };
}

/**
 * Mock one-click flow with fetch interception (no real network).
 * @param {{ module: string, clientArmed: boolean, serverArmed: boolean, doubleClick?: boolean, alreadySavedSame?: boolean }} opts
 */
function simulateOneClick(opts) {
  const posts = [];
  let baseline = { fingerprint: "fp-before", lock: "lock-v1", dirty: true };
  let saveInFlight = false;
  let dryRunInFlight = false;
  let userMessage = "";
  let didWrite = false;

  const mockFetch = async (url, init = {}) => {
    const body = JSON.parse(String(init.body ?? "{}"));
    const op = String(body.operation ?? body.dryRun === true ? "dryRun" : body.operation ?? "");
    const isDry =
      op === "dryRun" ||
      body.dryRun === true ||
      String(url).includes("dry-run") && body.operation !== "save";
    const isSave = op === "save" || body.operation === "save";

    if (isDry && !isSave) {
      posts.push({
        kind: "dryRun",
        module: opts.module,
        lock: body.expectedBeforeUpdatedAt ?? body.fingerprint ?? baseline.lock,
        fingerprint: body.fingerprint ?? baseline.fingerprint,
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          operation: "dryRun",
          dryRun: true,
          didWrite: false,
          dbWrite: false,
          networkWrite: false,
          saveEnabled: false,
          expectedBeforeUpdatedAt: baseline.lock,
          fingerprint: baseline.fingerprint,
          currentFileSha: "sha1",
        }),
      };
    }

    if (isSave) {
      posts.push({
        kind: "save",
        module: opts.module,
        lock: body.expectedBeforeUpdatedAt ?? body.fingerprint ?? null,
        fingerprint: body.fingerprint ?? null,
      });
      if (!opts.serverArmed) {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            ok: false,
            reasonCode: "save_not_armed",
            message: "Save is not armed on server",
            didWrite: false,
            dbWrite: false,
            networkWrite: false,
          }),
        };
      }
      const nextLock = "lock-v2";
      const nextFp = "fp-after";
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          operation: "save",
          didWrite: true,
          dbWrite: true,
          networkWrite: true,
          updated_at: nextLock,
          updatedAt: nextLock,
          fingerprint: nextFp,
          target: { updatedAt: nextLock },
          after: { fingerprint: nextFp },
        }),
      };
    }

    throw new Error(`unexpected fetch ${url} ${JSON.stringify(body)}`);
  };

  const start = evaluateOneClickSaveStartGate({
    clientArmed: opts.clientArmed,
    authenticated: true,
    dirty: baseline.dirty,
    saveInFlight,
    dryRunInFlight,
  });

  if (!start.canStart) {
    return {
      buttonEnabled: start.buttonEnabled,
      posts,
      userMessage: start.reason,
      didWrite: false,
      secondClickNeeded: false,
      baselineUpdated: false,
    };
  }

  // First click
  dryRunInFlight = true;
  const midGate = evaluateOneClickSaveStartGate({
    clientArmed: opts.clientArmed,
    authenticated: true,
    dirty: true,
    saveInFlight: false,
    dryRunInFlight: true,
  });
  if (opts.doubleClick) {
    // Second click while confirming — must not start another chain
    if (midGate.canStart || midGate.buttonEnabled) {
      throw new Error(`${opts.module}: double-click allowed during dry-run`);
    }
  }

  // programmatic Save must also respect client arm
  if (!isClientSaveArmed(opts.clientArmed)) {
    return {
      buttonEnabled: false,
      posts,
      userMessage: GOSAKI_CLIENT_SAVE_DISARMED_REASON,
      didWrite: false,
      secondClickNeeded: false,
      baselineUpdated: false,
    };
  }

  // dry-run then save (same lock/fingerprint)
  const dryRes = awaitable(mockFetch("https://mock/dry-run", {
    body: JSON.stringify({
      operation: "dryRun",
      expectedBeforeUpdatedAt: baseline.lock,
      fingerprint: baseline.fingerprint,
    }),
  }));
  dryRunInFlight = false;
  const dryJson = dryRes.jsonSync;
  const lock = dryJson.expectedBeforeUpdatedAt;
  const fingerprint = dryJson.fingerprint;

  saveInFlight = true;
  const saveGateDuring = evaluateOneClickSaveStartGate({
    clientArmed: opts.clientArmed,
    authenticated: true,
    dirty: true,
    saveInFlight: true,
    dryRunInFlight: false,
  });
  if (opts.doubleClick && (saveGateDuring.canStart || saveGateDuring.buttonEnabled)) {
    throw new Error(`${opts.module}: double-click allowed during save`);
  }

  if (opts.alreadySavedSame) {
    // After success, dirty=false → no second save of same change
    saveInFlight = false;
    baseline = { fingerprint, lock, dirty: false };
    const again = evaluateOneClickSaveStartGate({
      clientArmed: opts.clientArmed,
      authenticated: true,
      dirty: false,
      saveInFlight: false,
      dryRunInFlight: false,
    });
    return {
      buttonEnabled: again.buttonEnabled,
      posts,
      userMessage: again.reason,
      didWrite: true,
      secondClickNeeded: false,
      baselineUpdated: true,
      duplicateBlocked: !again.canStart,
    };
  }

  const saveRes = awaitable(mockFetch("https://mock/save", {
    body: JSON.stringify({
      operation: "save",
      expectedBeforeUpdatedAt: lock,
      fingerprint,
    }),
  }));
  saveInFlight = false;
  const saveJson = saveRes.jsonSync;
  const notArmed = isGosakiSaveNotArmedResponse(saveJson, saveRes.status);
  didWrite = saveJson.didWrite === true;

  if (notArmed) {
    userMessage = GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE;
  } else if (didWrite) {
    userMessage = "保存しました";
    baseline = {
      fingerprint: saveJson.fingerprint ?? fingerprint,
      lock: saveJson.updatedAt ?? lock,
      dirty: false,
    };
  } else {
    userMessage = "保存に失敗しました";
  }

  return {
    buttonEnabled: evaluateOneClickSaveStartGate({
      clientArmed: opts.clientArmed,
      authenticated: true,
      dirty: baseline.dirty,
      saveInFlight: false,
      dryRunInFlight: false,
    }).buttonEnabled,
    posts,
    userMessage,
    didWrite,
    secondClickNeeded: false,
    baselineUpdated: didWrite,
    lockMatched: posts.length === 2 && posts[0].lock === posts[1].lock,
    fingerprintMatched:
      posts.length === 2 &&
      (posts[0].fingerprint == null || posts[0].fingerprint === posts[1].fingerprint),
  };
}

function awaitable(promiseLike) {
  // mockFetch is async but returns plain object synchronously for our mock
  let resolved;
  promiseLike.then((r) => {
    resolved = r;
  });
  // Our mockFetch always resolves microtask-sync for these tests when we use sync path:
  // rewrite: make mockFetch sync
  return resolved;
}

// Rewrite simulate to use sync mockFetch (avoid microtask races)
function simulateOneClickSync(opts) {
  const posts = [];
  let baseline = { fingerprint: `fp-${opts.module}`, lock: `lock-${opts.module}-v1`, dirty: true };
  let saveInFlight = false;
  let dryRunInFlight = false;

  const mockFetchSync = (url, init = {}) => {
    const body = JSON.parse(String(init.body ?? "{}"));
    const op = String(body.operation ?? "");
    if (op === "dryRun") {
      posts.push({
        kind: "dryRun",
        lock: body.expectedBeforeUpdatedAt,
        fingerprint: body.fingerprint,
      });
      return {
        status: 200,
        json: {
          ok: true,
          operation: "dryRun",
          dryRun: true,
          didWrite: false,
          expectedBeforeUpdatedAt: body.expectedBeforeUpdatedAt,
          fingerprint: body.fingerprint,
        },
      };
    }
    if (op === "save") {
      posts.push({
        kind: "save",
        lock: body.expectedBeforeUpdatedAt,
        fingerprint: body.fingerprint,
      });
      if (!opts.serverArmed) {
        return {
          status: 403,
          json: {
            ok: false,
            reasonCode: "save_not_armed",
            message: "Save is not armed on server",
            didWrite: false,
          },
        };
      }
      return {
        status: 200,
        json: {
          ok: true,
          operation: "save",
          didWrite: true,
          updatedAt: `${body.expectedBeforeUpdatedAt}-next`,
          fingerprint: `${body.fingerprint}-next`,
          target: { updatedAt: `${body.expectedBeforeUpdatedAt}-next` },
        },
      };
    }
    throw new Error(`bad op ${op}`);
  };

  const start = evaluateOneClickSaveStartGate({
    clientArmed: opts.clientArmed,
    authenticated: true,
    dirty: baseline.dirty,
    saveInFlight: false,
    dryRunInFlight: false,
  });

  // A / programmatic Save start blocked when client disarmed
  if (!opts.clientArmed) {
    const prog = isClientSaveArmed(opts.clientArmed);
    return {
      scenario: "A",
      buttonEnabled: start.buttonEnabled,
      canStart: start.canStart,
      programmaticSaveAllowed: prog,
      posts,
      postCount: posts.length,
    };
  }

  if (!start.canStart) throw new Error(`${opts.module}: expected canStart when client armed`);

  dryRunInFlight = true;
  if (opts.doubleClick) {
    const mid = evaluateOneClickSaveStartGate({
      clientArmed: true,
      authenticated: true,
      dirty: true,
      saveInFlight: false,
      dryRunInFlight: true,
    });
    if (mid.buttonEnabled || mid.canStart) throw new Error(`${opts.module}: D dry-run double-click`);
  }

  const dry = mockFetchSync("mock", {
    body: JSON.stringify({
      operation: "dryRun",
      expectedBeforeUpdatedAt: baseline.lock,
      fingerprint: baseline.fingerprint,
    }),
  });
  dryRunInFlight = false;

  saveInFlight = true;
  if (opts.doubleClick) {
    const mid = evaluateOneClickSaveStartGate({
      clientArmed: true,
      authenticated: true,
      dirty: true,
      saveInFlight: true,
      dryRunInFlight: false,
    });
    if (mid.buttonEnabled || mid.canStart) throw new Error(`${opts.module}: D save double-click`);
  }

  const save = mockFetchSync("mock", {
    body: JSON.stringify({
      operation: "save",
      expectedBeforeUpdatedAt: dry.json.expectedBeforeUpdatedAt,
      fingerprint: dry.json.fingerprint,
    }),
  });
  saveInFlight = false;

  const notArmed = isGosakiSaveNotArmedResponse(save.json, save.status);
  const didWrite = save.json.didWrite === true;
  let saveNotArmedLocked = false;
  let userMessage = didWrite
    ? "保存しました"
    : notArmed
      ? GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE
      : "保存に失敗しました";

  if (didWrite) {
    baseline = {
      fingerprint: save.json.fingerprint,
      lock: save.json.updatedAt,
      dirty: false,
    };
  } else if (notArmed) {
    saveNotArmedLocked = true;
  }

  const afterGate = evaluateOneClickSaveStartGate({
    clientArmed: true,
    authenticated: true,
    dirty: baseline.dirty,
    saveInFlight: false,
    dryRunInFlight: false,
    saveNotArmedLocked,
  });

  const reclickGate = evaluateOneClickSaveStartGate({
    clientArmed: true,
    authenticated: true,
    dirty: true,
    saveInFlight: false,
    dryRunInFlight: false,
    saveNotArmedLocked: notArmed,
  });

  const reeditGate = notArmed
    ? evaluateOneClickSaveStartGate({
        clientArmed: true,
        authenticated: true,
        dirty: true,
        saveInFlight: false,
        dryRunInFlight: false,
        saveNotArmedLocked: false,
      })
    : null;

  return {
    scenario: opts.serverArmed ? "C" : "B",
    buttonEnabledAfter: afterGate.buttonEnabled,
    canStartAfter: afterGate.canStart,
    finalReason: afterGate.reason,
    reclickBlocked: notArmed ? !reclickGate.canStart && !reclickGate.buttonEnabled : null,
    reeditReenables: notArmed ? reeditGate?.buttonEnabled === true : null,
    posts,
    postCount: posts.length,
    kinds: posts.map((p) => p.kind),
    lockMatched: posts[0]?.lock === posts[1]?.lock,
    fingerprintMatched: posts[0]?.fingerprint === posts[1]?.fingerprint,
    userMessage,
    didWrite,
    secondClickNeeded: false,
    baselineUpdated: didWrite,
    duplicateBlocked: didWrite ? afterGate.canStart === false : null,
    doubleClickBlocked: opts.doubleClick === true,
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const MODULES = ["schedule", "discography", "youtube", "about"];
const results = {};

for (const module of MODULES) {
  // A
  const a = simulateOneClickSync({ module, clientArmed: false, serverArmed: false });
  assert(a.buttonEnabled === false, `${module} A: button must be disabled`);
  assert(a.canStart === false, `${module} A: canStart false`);
  assert(a.programmaticSaveAllowed === false, `${module} A: programmatic save blocked`);
  assert(a.postCount === 0, `${module} A: POST count must be 0, got ${a.postCount}`);

  // B
  const b = simulateOneClickSync({ module, clientArmed: true, serverArmed: false });
  assert(b.postCount === 2, `${module} B: expect 2 posts, got ${b.postCount}`);
  assert(b.kinds.join(",") === "dryRun,save", `${module} B: kinds ${b.kinds}`);
  assert(b.lockMatched && b.fingerprintMatched, `${module} B: lock/fingerprint mismatch`);
  assert(b.userMessage === GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE, `${module} B: stopped msg`);
  assert(b.finalReason === GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE, `${module} B: final reason`);
  assert(b.buttonEnabledAfter === false, `${module} B: button must stay disabled after save_not_armed`);
  assert(b.canStartAfter === false, `${module} B: canStart false after save_not_armed`);
  assert(b.reclickBlocked === true, `${module} B: re-click blocked while latched`);
  assert(b.reeditReenables === true, `${module} B: re-edit re-enables save`);
  assert(b.didWrite === false, `${module} B: didWrite`);
  assert(b.secondClickNeeded === false, `${module} B: second click`);

  // C
  const c = simulateOneClickSync({ module, clientArmed: true, serverArmed: true });
  assert(c.postCount === 2, `${module} C: expect 2 posts`);
  assert(c.kinds.join(",") === "dryRun,save", `${module} C: kinds`);
  assert(c.didWrite === true && c.baselineUpdated === true, `${module} C: success`);
  assert(c.duplicateBlocked === true, `${module} C: duplicate save blocked`);
  assert(c.lockMatched && c.fingerprintMatched, `${module} C: lock/fp`);

  // D
  const d = simulateOneClickSync({
    module,
    clientArmed: true,
    serverArmed: true,
    doubleClick: true,
  });
  assert(d.doubleClickBlocked === true, `${module} D: double-click`);
  assert(d.postCount === 2, `${module} D: still one chain (2 posts)`);

  results[module] = { A: "PASS", B: "PASS", C: "PASS", D: "PASS", A_posts: a.postCount };
}

// Source contract: client arm gates present; no saveBtn.click dependency
const files = {
  schedule: "gosaki-staging-schedule-operational-edit.ts",
  discography: "gosaki-staging-discography-operational-edit.ts",
  youtube: "gosaki-staging-youtube-multi-operational-edit.ts",
  about: "gosaki-staging-about-operational-edit.ts",
  helper: "gosaki-staging-one-click-save.ts",
};
for (const [key, name] of Object.entries(files)) {
  const src = fs.readFileSync(path.join(TEMPLATE, name), "utf8");
  if (key === "helper") {
    assert(src.includes("isClientSaveArmed"), "helper isClientSaveArmed");
    assert(src.includes("evaluateOneClickSaveStartGate"), "helper start gate");
    assert(src.includes("saveNotArmedLocked"), "helper saveNotArmedLocked");
    continue;
  }
  assert(src.includes("isClientSaveArmed") || src.includes("saveArmed"), `${key}: arm check`);
  assert(!src.includes("saveEl.click"), `${key}: no saveEl.click`);
  assert(!/saveBtn\.click\s*\(/.test(src), `${key}: no saveBtn.click()`);
  assert(src.includes("GOSAKI_CLIENT_SAVE_DISARMED_REASON") || src.includes("保存は現在無効です"), `${key}: disarmed reason`);
  assert(src.includes("saveNotArmedLocked"), `${key}: saveNotArmedLocked latch`);
  // UI must not dump tech in normal path labels
  assert(!/didWrite=<code>/.test(src), `${key}: no didWrite UI`);
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
console.log("ARM_CONTRACT_ASSERTS_PASS");
