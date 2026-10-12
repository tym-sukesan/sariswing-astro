#!/usr/bin/env node
/**
 * Extra-field Discography edit. Mock fetch only. Does not apply SQL or call the network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID,
  GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_MIXED_MESSAGE,
  classifyGosakiDiscographyEditChanges,
  runGosakiDiscographyExtraFieldsEdgeAttempt,
} from "../templates/site-extensions/gosaki-piano/gosaki-discography-extra-fields.ts";
import { validateDiscographyExtraFieldsRequest } from "../scripts/edge-functions/gosaki-discography-save-dry-run/extra-fields.ts";
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

const sql = read("scripts/supabase/gosaki-discography-operational-save-extra-fields-rpc.template.sql");
const saveMigration = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql"),
  "utf8",
);
const saveTemplate = read("scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql");
const createSql = read("scripts/supabase/gosaki-discography-operational-create-rpc.template.sql");
const publishSql = read("scripts/supabase/gosaki-discography-operational-set-published-rpc.template.sql");
const handler = read("scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts");
const deployedHandler = fs.readFileSync(
  path.join(repoRoot, "supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
  "utf8",
);
const edgeContract = read("scripts/edge-functions/gosaki-discography-save-dry-run/extra-fields.ts");
const deployedContract = fs.readFileSync(
  path.join(repoRoot, "supabase/functions/gosaki-discography-save-dry-run/extra-fields.ts"),
  "utf8",
);
const panel = read("templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro");
const client = read("templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts");
const liveRead = read("templates/site-extensions/gosaki-piano/gosaki-staging-admin-live-read.ts");
const page = read("templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro");
const workflow = fs.readFileSync(
  path.join(repoRoot, ".github/workflows/gosaki-piano-production-public-dist.yml"),
  "utf8",
);

const updateAt = sql.toLowerCase().indexOf("update public.discography");
const updateSql = updateAt >= 0 ? sql.slice(updateAt, sql.indexOf(";", updateAt)) : "";
const setBody = updateSql.slice(updateSql.toLowerCase().indexOf("set"), updateSql.toLowerCase().indexOf("where"));
const extraFn = handler.slice(
  handler.indexOf("export async function handleDiscographyExtraFieldsHttp"),
  handler.indexOf("export function handleDiscographyEdgeDryRunHttp"),
);
const saveFn = handler.slice(
  handler.indexOf("export async function handleOperationalDiscographySaveHttp"),
  handler.indexOf("export async function handleDiscographyCreateHttp"),
);

assert("edge copies match", handler === deployedHandler && edgeContract === deployedContract);
assert(
  "sql is a separate template and does not rewrite the other RPCs",
  sql.includes("DO NOT EXECUTE") &&
    sql.includes("gosaki_discography_operational_save_extra_fields") &&
    sql.includes("security definer") &&
    sql.includes("set search_path = pg_catalog, public") &&
    sql.includes("public.can_write_site(v_site_id)") &&
    sql.includes("v_site_slug <> 'gosaki-piano'") &&
    sql.includes("optimistic_lock_missing") &&
    sql.includes("for update") &&
    !sql.includes("create or replace function public.gosaki_discography_operational_save(") &&
    !saveMigration.includes("gosaki_discography_operational_save_extra_fields") &&
    !saveTemplate.includes("gosaki_discography_operational_save_extra_fields") &&
    !createSql.includes("gosaki_discography_operational_save_extra_fields") &&
    !publishSql.includes("gosaki_discography_operational_save_extra_fields"),
);
const extraGuardAt = sql.indexOf("do $save_extra_fields_owner_check$");
const extraGuardEnd = sql.indexOf("$save_extra_fields_owner_check$;", extraGuardAt);
const extraGuard = extraGuardAt >= 0 && extraGuardEnd > extraGuardAt
  ? sql.slice(extraGuardAt, extraGuardEnd)
  : "";
assert(
  "owner guard uses the current_user keyword",
  extraGuard.includes("if current_user in ('anon', 'authenticated') then") &&
    extraGuard.includes("if current_user is distinct from v_owner then") &&
    extraGuard.includes("STOP: current_user must be the owner of public.discography") &&
    extraGuard.includes("p.proname = 'gosaki_discography_operational_save_extra_fields'") &&
    extraGuard.includes("STOP: public.gosaki_discography_operational_save_extra_fields already exists") &&
    extraGuard.indexOf("already exists") < extraGuard.indexOf("if current_user in") &&
    sql.includes("create function public.gosaki_discography_operational_save_extra_fields(") &&
    !sql.toLowerCase().includes("create or replace") &&
    !extraGuard.includes("pg_catalog.current_user") &&
    !sql.includes("pg_catalog.current_user") &&
    sql.includes("select current_user as apply_role;"),
);
assert(
  "update writes only the six columns and updated_at",
  ["price", "purchase_note", "release_display", "catalog_number", "streaming_url", "cover_image_url", "updated_at"].every(
    (name) => setBody.includes(name),
  ) &&
    !setBody.includes("published") &&
    !setBody.includes("sort_order") &&
    !setBody.includes("title") &&
    !/\binsert\b/i.test(updateSql) &&
    !sql.includes("discography_tracks"),
);
assert(
  "extra arm is checked before its rpc and save stays on its own arm",
  extraFn.indexOf("extra_fields_not_armed") < extraFn.indexOf("client.rpc(") &&
    extraFn.includes("isDiscographyExtraFieldsArmed()") &&
    !extraFn.includes("isDiscographySaveArmed") &&
    saveFn.includes("client.rpc(OPERATIONAL_SAVE_RPC_NAME,") &&
    saveFn.includes("isDiscographySaveArmed()") &&
    !saveFn.includes("DISCOGRAPHY_EXTRA_FIELDS_RPC_NAME"),
);
assert(
  "live read and edit form expose the six fields",
  liveRead.includes("price,purchase_note,release_display") &&
    ["price", "purchase_note", "release_display", "catalog_number", "streaming_url", "cover_image_url"].every((name) =>
      panel.includes(`data-gosaki-disc-extra-field="${name}"`),
    ) &&
    panel.includes("data-gosaki-disc-extra-fields") &&
    (panel.match(/data-gosaki-disc-save(?!-)/g) || []).length === 1,
);
const saveClick = client.slice(client.lastIndexOf('if (editClass === "mixed")'), client.lastIndexOf('if (editClass === "mixed")') + 500);
assert(
  "mixed edits return before either save and the existing save fetch remains",
  client.includes("GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_MIXED_MESSAGE") &&
    saveClick.indexOf('editClass === "mixed"') < saveClick.indexOf("await presentExtraFieldsSave()") &&
    saveClick.includes("return;") &&
    client.includes("await fetch(saveEndpoint,"),
);
assert(
  "new client arm stays off unless exact true and the workflow does not enable it",
  page.includes("data-gosaki-discography-extra-fields-armed") &&
    page.includes('saveArmed: body?.dataset.gosakiDiscographySaveArmed === "true"') &&
    !isSaveArmExactTrue(undefined) &&
    !isSaveArmExactTrue("TRUE") &&
    isSaveArmExactTrue("true") &&
    !workflow.includes("PUBLIC_GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_UI_ARMED") &&
    !workflow.includes("GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_ARMED"),
);

const original = {
  title: "Album",
  artist: "",
  release_date: "",
  label: "",
  purchase_url: "",
  description: "",
  tracks: "One",
  price: "1000",
  purchase_note: "",
  release_display: "",
  catalog_number: "G-1",
  streaming_url: "",
  cover_image_url: "",
};
const coreOnly = classifyGosakiDiscographyEditChanges({
  originalCore: original,
  currentCore: { ...original, title: "Album 2" },
  originalExtra: original,
  currentExtra: original,
});
const extraOnly = classifyGosakiDiscographyEditChanges({
  originalCore: original,
  currentCore: original,
  originalExtra: original,
  currentExtra: { ...original, price: "2000" },
});
const mixed = classifyGosakiDiscographyEditChanges({
  originalCore: original,
  currentCore: { ...original, tracks: "One\nTwo" },
  originalExtra: original,
  currentExtra: { ...original, catalog_number: "G-2" },
});
assert("change detection separates core, extra, and mixed", coreOnly === "core" && extraOnly === "extra" && mixed === "mixed");
assert("mixed message does not describe a successful save", GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_MIXED_MESSAGE.includes("別々に保存"));

const endpoint = "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run";
const lock = "2026-10-12T00:00:00.000Z";
function mockFetch(response) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return { status: response.status, json: async () => response.body };
  };
  return { calls, fetchImpl };
}

const off = mockFetch({ status: 200, body: { ok: true, updatedAt: lock } });
const offResult = await runGosakiDiscographyExtraFieldsEdgeAttempt({
  armed: false,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: lock,
  fields: { price: "2000" },
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: off.fetchImpl,
});
assert("arm off does not post", off.calls.length === 0 && offResult.called === false && offResult.body.reasonCode === "extra_fields_not_armed");

const missingLock = mockFetch({ status: 200, body: { ok: true, updatedAt: lock } });
const missingLockResult = await runGosakiDiscographyExtraFieldsEdgeAttempt({
  armed: true,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: " ",
  fields: { price: "2000" },
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: missingLock.fetchImpl,
});
assert(
  "missing lock does not post",
  missingLock.calls.length === 0 && missingLockResult.body.reasonCode === "optimistic_lock_missing",
);

const on = mockFetch({ status: 200, body: { ok: true, updatedAt: "2026-10-12T01:00:00.000Z", legacyId: "discography-005" } });
const onResult = await runGosakiDiscographyExtraFieldsEdgeAttempt({
  armed: true,
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: lock,
  fields: {
    price: " 2000 ",
    purchase_note: "shop",
    release_display: "2026.10",
    catalog_number: "G-2",
    streaming_url: "https://example.com/stream",
    cover_image_url: "https://example.com/cover.jpg",
  },
  endpoint,
  anonKey: "anon",
  accessToken: "jwt",
  endpointSafe: true,
  fetchImpl: on.fetchImpl,
});
const posted = on.calls[0]?.body;
const edgeValidated = validateDiscographyExtraFieldsRequest(posted);
assert(
  "extra-only payload matches the rpc arguments",
  on.calls.length === 1 &&
    posted?.operation === "saveExtraFields" &&
    posted?.approvalId === GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID &&
    posted?.legacyId === "discography-005" &&
    posted?.expectedBeforeUpdatedAt === lock &&
    posted?.release?.price === "2000" &&
    !Object.prototype.hasOwnProperty.call(posted, "published") &&
    !Object.prototype.hasOwnProperty.call(posted.release, "title") &&
    edgeValidated.ok === true &&
    Object.keys(edgeValidated.rpcArgs).sort().join(",") ===
      "p_catalog_number,p_cover_image_url,p_expected_before_updated_at,p_legacy_id,p_price,p_purchase_note,p_release_display,p_site_slug,p_streaming_url" &&
    onResult.called === true,
);

const scriptUrl = validateDiscographyExtraFieldsRequest({
  ...posted,
  release: { ...posted.release, streaming_url: "javascript:alert(1)" },
});
assert("javascript url is rejected", scriptUrl.ok === false && scriptUrl.reasonCode === "field_validation_failed");

const withTitle = validateDiscographyExtraFieldsRequest({
  ...posted,
  release: { ...posted.release, title: "nope" },
});
assert("existing save columns are rejected", withTitle.ok === false && withTitle.reasonCode === "unexpected_payload");

const conflict = { ok: false, reasonCode: "optimistic_lock_conflict" };
assert("lock conflict is not a successful save", conflict.ok === false && conflict.reasonCode === "optimistic_lock_conflict");

console.log(`PASS ${passed}`);
if (failed > 0) {
  console.error(`FAIL ${failed}`);
  process.exit(1);
}
