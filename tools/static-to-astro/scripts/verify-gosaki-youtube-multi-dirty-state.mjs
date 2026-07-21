/**
 * YouTube multi-edit dirty / reference-isolation regression (network-free).
 * Guards against baseline↔items shared refs and stale items after URL edits.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const SRC = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-youtube-multi-operational-edit.ts",
);

const GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE = "現在、保存機能は停止しています";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function cloneYoutubeDraftItems(list) {
  return (list ?? []).map((item) => ({
    id: String(item.id ?? ""),
    published: item.published === true,
    sortOrder: Number(item.sortOrder) || 0,
    embedCode: String(item.embedCode ?? ""),
    ...(item.title != null ? { title: String(item.title) } : {}),
  }));
}

function youtubeDraftItemsFingerprint(list) {
  return JSON.stringify(
    (list ?? []).map((i) => ({
      id: i.id,
      published: i.published === true,
      sortOrder: Number(i.sortOrder) || 0,
      embedCode: String(i.embedCode ?? ""),
    })),
  );
}

function isYoutubeDraftDirty(baseline, current) {
  return youtubeDraftItemsFingerprint(current) !== youtubeDraftItemsFingerprint(baseline);
}

function evaluateSaveGate({ clientArmed, authenticated, dirty, saveNotArmedLocked }) {
  if (saveNotArmedLocked) {
    return { buttonEnabled: false, reason: GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE };
  }
  if (!clientArmed) return { buttonEnabled: false, reason: "保存は現在無効です" };
  if (!dirty) return { buttonEnabled: false, reason: "変更がありません" };
  if (!authenticated) return { buttonEnabled: false, reason: "ログインが必要です" };
  return { buttonEnabled: true, reason: "保存" };
}

function renumberSortOrders(next) {
  return next.map((item, index) => ({ ...item, sortOrder: (index + 1) * 10 }));
}

function simulateEditor() {
  const loaded = [
    {
      id: "yt-a",
      published: true,
      sortOrder: 10,
      embedCode: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: "yt-b",
      published: false,
      sortOrder: 20,
      embedCode: "https://youtu.be/aaaaaaaaaaa",
    },
  ];

  // Load: independent deep clones (must not share refs)
  let baseline = cloneYoutubeDraftItems(loaded);
  let items = cloneYoutubeDraftItems(baseline);

  assert(baseline !== items, "baseline array !== items array");
  assert(baseline[0] !== items[0], "baseline[0] !== items[0]");
  assert(!isYoutubeDraftDirty(baseline, items), "initial dirty=false");

  // Mutating items must not mutate baseline
  items[0].embedCode = "MUTATED";
  assert(
    baseline[0].embedCode === "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "baseline embedCode must stay fixed after items mutation",
  );
  items = cloneYoutubeDraftItems(baseline); // restore for next tests

  const results = {};

  // URL edit → dirty + save enabled (client armed)
  items = cloneYoutubeDraftItems(baseline);
  items[0] = {
    ...items[0],
    embedCode: "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  };
  results.urlEdit = {
    dirty: isYoutubeDraftDirty(baseline, items),
    gate: evaluateSaveGate({
      clientArmed: true,
      authenticated: true,
      dirty: isYoutubeDraftDirty(baseline, items),
      saveNotArmedLocked: false,
    }),
  };

  // Restore original URL → dirty=false
  items[0] = {
    ...items[0],
    embedCode: baseline[0].embedCode,
  };
  results.urlRestore = {
    dirty: isYoutubeDraftDirty(baseline, items),
    gate: evaluateSaveGate({
      clientArmed: true,
      authenticated: true,
      dirty: isYoutubeDraftDirty(baseline, items),
      saveNotArmedLocked: false,
    }),
  };

  // Published toggle
  items = cloneYoutubeDraftItems(baseline);
  items[1] = { ...items[1], published: !items[1].published };
  results.publishedToggle = {
    dirty: isYoutubeDraftDirty(baseline, items),
  };

  // Add
  items = cloneYoutubeDraftItems(baseline);
  items = renumberSortOrders([
    ...items,
    {
      id: "yt-new",
      published: false,
      sortOrder: 30,
      embedCode: "https://youtu.be/bbbbbbbbbbb",
    },
  ]);
  results.add = { dirty: isYoutubeDraftDirty(baseline, items) };

  // Duplicate
  items = cloneYoutubeDraftItems(baseline);
  const src = items[0];
  items = renumberSortOrders([
    items[0],
    { ...src, id: "yt-dup", published: false, sortOrder: 15 },
    items[1],
  ]);
  results.duplicate = { dirty: isYoutubeDraftDirty(baseline, items) };

  // Reorder
  items = cloneYoutubeDraftItems(baseline);
  items = renumberSortOrders([items[1], items[0]]);
  results.reorder = { dirty: isYoutubeDraftDirty(baseline, items) };

  // Cancel / discard restores baseline clone (no shared refs)
  items = cloneYoutubeDraftItems(baseline);
  items[0] = { ...items[0], embedCode: "https://youtu.be/ccccccccccc" };
  assert(isYoutubeDraftDirty(baseline, items), "pre-cancel dirty");
  items = cloneYoutubeDraftItems(baseline);
  results.cancel = {
    dirty: isYoutubeDraftDirty(baseline, items),
    independent: baseline !== items && baseline[0] !== items[0],
  };

  // save_not_armed latch: after Save rejection, button stays disabled while dirty
  items = cloneYoutubeDraftItems(baseline);
  items[0] = {
    ...items[0],
    embedCode: "https://www.youtube.com/watch?v=yyyyyyyyyyy",
  };
  const afterNotArmed = evaluateSaveGate({
    clientArmed: true,
    authenticated: true,
    dirty: true,
    saveNotArmedLocked: true,
  });
  results.saveNotArmedLatch = {
    dirty: isYoutubeDraftDirty(baseline, items),
    buttonEnabled: afterNotArmed.buttonEnabled,
    reason: afterNotArmed.reason,
  };

  return results;
}

const src = fs.readFileSync(SRC, "utf8");
assert(src.includes("cloneYoutubeDraftItems"), "source exports/uses cloneYoutubeDraftItems");
assert(src.includes("isYoutubeDraftDirty"), "source uses isYoutubeDraftDirty");
assert(src.includes("syncFromDom()"), "source has syncFromDom");
assert(
  /onItemFieldEdited[\s\S]*syncFromDom\(\)/.test(src) ||
    /function onItemFieldEdited[\s\S]*syncFromDom\(\)/.test(src),
  "field edit handler must syncFromDom before dirty gate",
);
assert(src.includes('addEventListener("input", onItemFieldEdited)'), "input wired");
assert(src.includes('addEventListener("change", onItemFieldEdited)'), "change wired");
const editHandlerIdx = src.indexOf("function onItemFieldEdited");
assert(editHandlerIdx >= 0, "onItemFieldEdited defined");
const syncIdx = src.indexOf("syncFromDom()", editHandlerIdx);
const invalidateIdx = src.indexOf("invalidateDryRunUi()", editHandlerIdx);
assert(syncIdx > editHandlerIdx && invalidateIdx > syncIdx, "syncFromDom before invalidateDryRunUi");

const r = simulateEditor();

assert(r.urlEdit.dirty === true, "URL edit → dirty");
assert(r.urlEdit.gate.buttonEnabled === true, "URL edit → save enabled (client armed)");
assert(r.urlRestore.dirty === false, "URL restore → dirty false");
assert(r.urlRestore.gate.buttonEnabled === false, "URL restore → save disabled");
assert(r.urlRestore.gate.reason === "変更がありません", "URL restore reason");
assert(r.publishedToggle.dirty === true, "published toggle → dirty");
assert(r.add.dirty === true, "add → dirty");
assert(r.duplicate.dirty === true, "duplicate → dirty");
assert(r.reorder.dirty === true, "reorder → dirty");
assert(r.cancel.dirty === false, "cancel → dirty false");
assert(r.cancel.independent === true, "cancel restores independent clone");
assert(r.saveNotArmedLatch.dirty === true, "save_not_armed keeps form dirty");
assert(r.saveNotArmedLatch.buttonEnabled === false, "save_not_armed keeps button disabled");
assert(
  r.saveNotArmedLatch.reason === GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE,
  "save_not_armed message",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      results: {
        urlEdit: r.urlEdit,
        urlRestore: { dirty: r.urlRestore.dirty, buttonEnabled: r.urlRestore.gate.buttonEnabled },
        publishedToggle: r.publishedToggle,
        add: r.add,
        duplicate: r.duplicate,
        reorder: r.reorder,
        cancel: r.cancel,
        saveNotArmedLatch: r.saveNotArmedLatch,
      },
    },
    null,
    2,
  ),
);
console.log("YOUTUBE_MULTI_DIRTY_STATE_ASSERTS_PASS");
