#!/usr/bin/env node
/**
 * Admin wiring for Discography create / setPublished.
 * Uses a mock fetch. Does not call the network or the database.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_DISCOGRAPHY_CREATE_EDGE_APPROVAL_ID,
  GOSAKI_DISCOGRAPHY_CREATE_SAVED_MESSAGE_PREFIX,
  GOSAKI_DISCOGRAPHY_PUBLISH_SITE_UPDATE_MESSAGE,
  GOSAKI_DISCOGRAPHY_SET_PUBLISHED_EDGE_APPROVAL_ID,
  gosakiDiscographyEdgeFailureMessage,
  gosakiDiscographyPublishAvailability,
  runGosakiDiscographyCreateEdgeAttempt,
  runGosakiDiscographySetPublishedEdgeAttempt,
} from "../templates/site-extensions/gosaki-piano/gosaki-discography-create-draft.ts";
import { isSaveArmExactTrue } from "../templates/site-extensions/gosaki-piano/save-arm-utils.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "../..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

let passed = 0;
let failed = 0;
function assert(name, ok) {
  if (ok) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}`);
  }
}

const admin = read("templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts");
const panel = read("templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro");
const client = read("templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts");
const page = read("templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro");
const workflow = fs.readFileSync(
  path.join(repoRoot, ".github/workflows/gosaki-piano-production-public-dist.yml"),
  "utf8",
);

const createFn = client.slice(
  client.indexOf("const presentCreateLocalDryRun"),
  client.indexOf("const enterEdit"),
);
const edgeFn = client.slice(
  client.indexOf("const presentCreateEdgeSave"),
  client.indexOf("const presentSetPublished"),
);
const publishFn = client.slice(
  client.indexOf("const presentSetPublished"),
  client.indexOf('root.addEventListener("click"'),
);
const saveClickStart = client.indexOf("if (createUiArmed())");
const saveClick = client.slice(saveClickStart, saveClickStart + 280);
const createArmFn = admin.slice(
  admin.indexOf("export function isGosakiDiscographyCreateUiArmed"),
  admin.indexOf("export function isGosakiDiscographySetPublishedUiArmed"),
);
const publishArmFn = admin.slice(
  admin.indexOf("export function isGosakiDiscographySetPublishedUiArmed"),
  admin.indexOf("export function assertG20u41DiscographySaveEndpointSafe"),
);
const existingSaveArm = admin.slice(
  admin.indexOf("export function isG20u41DiscographyOperationalSaveArmed"),
  admin.indexOf("export const GOSAKI_DISCOGRAPHY_CREATE_UI_ARMED_ENV"),
);
const editableKeys = client.slice(
  client.indexOf("const EDITABLE_KEYS"),
  client.indexOf("function readAlbumsJson"),
);

const input = {
  title: " New Album ",
  artist: "",
  releaseDate: "",
  releaseDisplay: "",
  label: "",
  catalogNumber: "",
  price: "",
  purchaseNote: "",
  description: "",
  purchaseUrl: "",
  streamingUrl: "",
  coverImageUrl: "",
  trackListText: "One\n\nTwo",
};

const endpoint = "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run";

function mockFetch(response) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) });
    return {
      status: response.status,
      json: async () => response.body,
    };
  };
  return { calls, fetchImpl };
}

assert(
  "create mode keeps local dry-run when the create arm is off",
  saveClick.includes("createUiArmed()") &&
    saveClick.indexOf("presentCreateEdgeSave") < saveClick.indexOf("await presentCreateLocalDryRun();") &&
    createFn.includes("validateGosakiDiscographyCreateInput") &&
    !createFn.includes("fetch("),
);
assert(
  "existing edit save and editable keys stay",
  client.includes("await fetch(saveEndpoint,") &&
    client.includes("buildSaveEndpointRequest") &&
    editableKeys.includes('"title"') &&
    editableKeys.includes('"tracks"') &&
    !editableKeys.includes("price") &&
    saveClick.includes("return;"),
);
assert(
  "one save button and the fixed save bar remain",
  (panel.match(/data-gosaki-disc-save(?!-)/g) || []).length === 1 &&
    panel.includes("gosaki-admin-save-area") &&
    panel.includes("編集をやめる"),
);
assert(
  "page arms default through exact true and do not replace the save arm",
  page.includes('saveArmed: body?.dataset.gosakiDiscographySaveArmed === "true"') &&
    page.includes("data-gosaki-discography-create-armed") &&
    page.includes("data-gosaki-discography-set-published-armed") &&
    page.includes("isGosakiDiscographyCreateUiArmed") &&
    admin.includes("export function isGosakiDiscographyCreateUiArmed") &&
    admin.includes("export function isGosakiDiscographySetPublishedUiArmed") &&
    admin.includes("PUBLIC_GOSAKI_DISCOGRAPHY_CREATE_UI_ARMED") &&
    admin.includes("PUBLIC_GOSAKI_DISCOGRAPHY_SET_PUBLISHED_UI_ARMED") &&
    createArmFn.includes("isSaveArmExactTrue") &&
    publishArmFn.includes("isSaveArmExactTrue") &&
    existingSaveArm.includes("G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV") &&
    !existingSaveArm.includes("CREATE_UI") &&
    !isSaveArmExactTrue(undefined) &&
    !isSaveArmExactTrue("TRUE") &&
    !isSaveArmExactTrue("false") &&
    isSaveArmExactTrue("true"),
);
assert(
  "production workflow bakes the new client arms true and leaves server arms unset",
  workflow.includes("export PUBLIC_GOSAKI_DISCOGRAPHY_CREATE_UI_ARMED=true") &&
    workflow.includes("export PUBLIC_GOSAKI_DISCOGRAPHY_SET_PUBLISHED_UI_ARMED=true") &&
    workflow.includes("export PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true") &&
    !workflow.includes("GOSAKI_DISCOGRAPHY_CREATE_ARMED") &&
    !workflow.includes("GOSAKI_DISCOGRAPHY_SET_PUBLISHED_ARMED"),
);
assert(
  "draft cards expose a draft label and publish control from live read",
  client.includes('album.published === false ? "下書き" : "公開対象"') &&
    client.includes('button.textContent = "公開対象にする"') &&
    client.includes("syncDiscographyDraftPublishControl") &&
    client.includes("album.updatedAt") &&
    !publishFn.includes("gosaki-production-deploy") &&
    !publishFn.includes("workflow_dispatch") &&
    panel.includes("data-gosaki-disc-site-update-note") &&
    panel.includes("サイト全体が対象です") &&
    panel.includes("公開対象") &&
    !panel.includes('href="/admin/"'),
);
assert(
  "create success refreshes live read and failure does not insert a card",
  edgeFn.indexOf("if (!saved)") < edgeFn.indexOf("GOSAKI_DISCOGRAPHY_CREATE_SAVED_MESSAGE_PREFIX") &&
    edgeFn.includes("requestManualReload") &&
    edgeFn.indexOf("if (!saved)") < edgeFn.indexOf("requestManualReload") &&
    !edgeFn.includes("albums.push") &&
    !edgeFn.includes("albumById.set") &&
    GOSAKI_DISCOGRAPHY_CREATE_SAVED_MESSAGE_PREFIX === "下書きとして保存しました",
);
assert(
  "publish confirms, then posts, then asks for the existing site update",
  publishFn.indexOf("window.confirm") < publishFn.indexOf("runGosakiDiscographySetPublishedEdgeAttempt") &&
    publishFn.includes("expectedBeforeUpdatedAt: album.updatedAt") &&
    publishFn.includes("GOSAKI_DISCOGRAPHY_PUBLISH_SITE_UPDATE_MESSAGE") &&
    publishFn.indexOf("if (!publishedNow)") < publishFn.indexOf("requestManualReload") &&
    GOSAKI_DISCOGRAPHY_PUBLISH_SITE_UPDATE_MESSAGE ===
      "公開対象に設定しました。公開サイトへの反映には、管理ポータルの「公開サイトを更新」が必要です。" &&
    publishFn.includes("公開対象に設定します") &&
    publishFn.includes("この操作だけでは公開サイトに反映されません"),
);

const off = mockFetch({ status: 200, body: { ok: true } });
const offResult = await runGosakiDiscographyCreateEdgeAttempt({
  armed: false,
  createInput: input,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: off.fetchImpl,
});
assert("arm off does not post", offResult.mode === "dry-run" && offResult.called === false && off.calls.length === 0);

const on = mockFetch({
  status: 200,
  body: { ok: true, legacyId: "discography-005", published: false },
});
const onResult = await runGosakiDiscographyCreateEdgeAttempt({
  armed: true,
  createInput: input,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: on.fetchImpl,
});
const posted = on.calls[0]?.body;
assert(
  "arm on posts create without legacy id or published",
  on.calls.length === 1 &&
    on.calls[0].url === endpoint &&
    on.calls[0].init.method === "POST" &&
    String(on.calls[0].init.headers.Authorization).startsWith("Bearer ") &&
    posted?.operation === "create" &&
    posted?.approvalId === GOSAKI_DISCOGRAPHY_CREATE_EDGE_APPROVAL_ID &&
    posted?.siteSlug === "gosaki-piano" &&
    posted?.release?.title === "New Album" &&
    Array.isArray(posted?.trackTitles) &&
    posted.trackTitles.join(",") === "One,Two" &&
    !Object.prototype.hasOwnProperty.call(posted, "legacyId") &&
    !Object.prototype.hasOwnProperty.call(posted, "published") &&
    !Object.prototype.hasOwnProperty.call(posted.release, "published") &&
    onResult.called === true,
);

const invalid = mockFetch({ status: 200, body: { ok: true, legacyId: "discography-005", published: false } });
const invalidResult = await runGosakiDiscographyCreateEdgeAttempt({
  armed: true,
  createInput: { ...input, title: "  " },
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: invalid.fetchImpl,
});
assert("invalid create does not post or look successful", invalid.calls.length === 0 && invalidResult.called === false && invalidResult.body.ok !== true);

const unsafe = mockFetch({ status: 200, body: { ok: true, legacyId: "discography-005", published: false } });
const unsafeResult = await runGosakiDiscographyCreateEdgeAttempt({
  armed: true,
  createInput: input,
  endpoint,
  anonKey: "anon",
  accessToken: "",
  endpointSafe: false,
  fetchImpl: unsafe.fetchImpl,
});
assert("missing auth does not post", unsafe.calls.length === 0 && unsafeResult.called === false);

const denied = mockFetch({ status: 403, body: { ok: false, reasonCode: "create_not_armed" } });
const deniedResult = await runGosakiDiscographyCreateEdgeAttempt({
  armed: true,
  createInput: input,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: denied.fetchImpl,
});
const deniedSaved =
  deniedResult.called &&
  deniedResult.status === 200 &&
  deniedResult.body.ok === true &&
  deniedResult.body.published === false;
assert(
  "create 403 is not a success",
  deniedResult.status === 403 &&
    deniedSaved === false &&
    gosakiDiscographyEdgeFailureMessage(403, "create_not_armed").includes("停止"),
);

assert(
  "409 422 and 403 have distinct messages",
  gosakiDiscographyEdgeFailureMessage(409, "optimistic_lock_conflict").includes("競合") &&
    gosakiDiscographyEdgeFailureMessage(422, "already_published").includes("公開済み") &&
    gosakiDiscographyEdgeFailureMessage(403, "can_write_site_denied").includes("権限") &&
    gosakiDiscographyEdgeFailureMessage(403, "set_published_not_armed").includes("停止"),
);

assert(
  "only an unpublished row with a lock can be published",
  gosakiDiscographyPublishAvailability({ published: true, updatedAt: "2026-10-11T00:00:00.000Z" }).showPublish === false &&
    gosakiDiscographyPublishAvailability({ published: false, updatedAt: "" }).enabled === false &&
    gosakiDiscographyPublishAvailability({ published: false, updatedAt: "2026-10-11T00:00:00.000Z" }).enabled === true,
);

const lock = "2026-10-11T00:00:00.000Z";
const publish = mockFetch({
  status: 200,
  body: { ok: true, published: true, updatedAt: "2026-10-11T01:00:00.000Z" },
});
const publishResult = await runGosakiDiscographySetPublishedEdgeAttempt({
  armed: true,
  confirmAccepted: true,
  published: false,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: lock,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: publish.fetchImpl,
});
const publishBody = publish.calls[0]?.body;
assert(
  "setPublished posts the live-read lock",
  publish.calls.length === 1 &&
    publishBody?.operation === "setPublished" &&
    publishBody?.approvalId === GOSAKI_DISCOGRAPHY_SET_PUBLISHED_EDGE_APPROVAL_ID &&
    publishBody?.legacyId === "discography-005" &&
    publishBody?.expectedBeforeUpdatedAt === lock &&
    publishBody?.published === true &&
    publishResult.body.published === true,
);

const noLock = mockFetch({ status: 200, body: { ok: true, published: true } });
const noLockResult = await runGosakiDiscographySetPublishedEdgeAttempt({
  armed: true,
  confirmAccepted: true,
  published: false,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "  ",
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: noLock.fetchImpl,
});
assert(
  "missing lock does not post",
  noLock.calls.length === 0 && noLockResult.called === false && noLockResult.body.reasonCode === "optimistic_lock_missing",
);

const already = mockFetch({ status: 200, body: { ok: true, published: true } });
const alreadyResult = await runGosakiDiscographySetPublishedEdgeAttempt({
  armed: true,
  confirmAccepted: true,
  published: true,
  legacyId: "discography-001",
  expectedBeforeUpdatedAt: lock,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: already.fetchImpl,
});
assert("published rows are not sent again", already.calls.length === 0 && alreadyResult.body.reasonCode === "already_published");

const unconfirmed = mockFetch({ status: 200, body: { ok: true, published: true } });
const unconfirmedResult = await runGosakiDiscographySetPublishedEdgeAttempt({
  armed: true,
  confirmAccepted: false,
  published: false,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: lock,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: unconfirmed.fetchImpl,
});
assert("publish without confirmation does not post", unconfirmed.calls.length === 0 && unconfirmedResult.body.reasonCode === "confirm_required");

const disarmed = mockFetch({ status: 200, body: { ok: true, published: true } });
const disarmedResult = await runGosakiDiscographySetPublishedEdgeAttempt({
  armed: false,
  confirmAccepted: true,
  published: false,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: lock,
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: disarmed.fetchImpl,
});
assert("setPublished arm off does not post", disarmed.calls.length === 0 && disarmedResult.called === false);

console.log(`PASS ${passed}`);
if (failed > 0) {
  console.error(`FAIL ${failed}`);
  process.exit(1);
}
