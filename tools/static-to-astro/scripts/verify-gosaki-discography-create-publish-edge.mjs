#!/usr/bin/env node
/**
 * Offline verifier for Discography create and setPublished Edge operations.
 * Does not call the network and does not deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DISCOGRAPHY_CREATE_APPROVAL_ID,
  DISCOGRAPHY_CREATE_ARMED_ENV,
  DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  DISCOGRAPHY_SET_PUBLISHED_ARMED_ENV,
  isDiscographyEdgeArmExactTrue,
  mapDiscographyWriteRpcResult,
  validateDiscographyCreateRequest,
  validateDiscographySetPublishedRequest,
} from "../scripts/edge-functions/gosaki-discography-save-dry-run/create-publish.ts";

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(toolRoot, "../..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

const toolsHandler = read("tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts");
const rootHandler = read("supabase/functions/gosaki-discography-save-dry-run/handler.ts");
const toolsContract = read("tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/create-publish.ts");
const rootContract = read("supabase/functions/gosaki-discography-save-dry-run/create-publish.ts");
const saveTemplate = read("tools/static-to-astro/scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql");
const createSql = read("tools/static-to-astro/scripts/supabase/gosaki-discography-operational-create-rpc.template.sql");
const publishSql = read("tools/static-to-astro/scripts/supabase/gosaki-discography-operational-set-published-rpc.template.sql");

const failures = [];
function check(name, ok) {
  if (!ok) failures.push(name);
}

function sliceBetween(src, start, end) {
  const from = src.indexOf(start);
  const to = src.indexOf(end, from + start.length);
  return from >= 0 && to > from ? src.slice(from, to) : "";
}

const createFn = sliceBetween(toolsHandler, "export async function handleDiscographyCreateHttp", "export async function handleDiscographySetPublishedHttp");
const publishFn = sliceBetween(toolsHandler, "export async function handleDiscographySetPublishedHttp", "export function handleDiscographyEdgeDryRunHttp");
const saveFn = sliceBetween(toolsHandler, "export async function handleOperationalDiscographySaveHttp", "export async function handleDiscographyCreateHttp");
const syncFn = sliceBetween(toolsHandler, "export function handleDiscographyEdgeDryRunHttp", "export async function handleDiscographyEdgeDryRunHttpAsync");
const asyncFn = toolsHandler.slice(toolsHandler.indexOf("export async function handleDiscographyEdgeDryRunHttpAsync"));

check("edge copies match", toolsHandler === rootHandler && toolsContract === rootContract);
check("existing save arm, approval, and rpc call stay in the save handler",
  saveFn.includes("isDiscographySaveArmed()") &&
    saveFn.includes("OPERATIONAL_SAVE_APPROVAL_ID") &&
    saveFn.includes("client.rpc(OPERATIONAL_SAVE_RPC_NAME,") &&
    saveFn.includes("SAVE_READINESS_NOT_ARMED") &&
    !saveFn.includes("DISCOGRAPHY_CREATE_RPC_NAME") &&
    !saveFn.includes("DISCOGRAPHY_SET_PUBLISHED_RPC_NAME"));
check("async handler runs create and setPublished before save",
  asyncFn.indexOf("DISCOGRAPHY_CREATE_OPERATION") < asyncFn.indexOf("handleOperationalDiscographySaveHttp") &&
    asyncFn.indexOf("DISCOGRAPHY_SET_PUBLISHED_OPERATION") < asyncFn.indexOf("handleOperationalDiscographySaveHttp") &&
    asyncFn.includes("isSaveArmed: options.isSaveArmed"));
check("sync dry-run rejects the new operations without an rpc call",
  syncFn.includes("operation_requires_async") &&
    syncFn.indexOf("operation_requires_async") < syncFn.indexOf("CONTROLLED_SAVE_OPERATION") &&
    !syncFn.includes(".rpc("));
check("create arm is checked before its rpc call",
  createFn.indexOf("create_not_armed") < createFn.indexOf("client.rpc(DISCOGRAPHY_CREATE_RPC_NAME") &&
    createFn.includes("isDiscographyCreateArmed()") &&
    !createFn.includes("isDiscographySaveArmed"));
check("setPublished arm is checked before its rpc call",
  publishFn.indexOf("set_published_not_armed") < publishFn.indexOf("client.rpc(") &&
    publishFn.includes("isDiscographySetPublishedArmed()") &&
    !publishFn.includes("isDiscographySaveArmed"));
check("new arms and approval ids are independent",
  toolsHandler.includes(DISCOGRAPHY_CREATE_ARMED_ENV) &&
    toolsHandler.includes(DISCOGRAPHY_SET_PUBLISHED_ARMED_ENV) &&
    DISCOGRAPHY_CREATE_APPROVAL_ID === "gosaki-discography-operational-create" &&
    DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID === "gosaki-discography-operational-set-published" &&
    DISCOGRAPHY_CREATE_APPROVAL_ID !== "gosaki-discography-operational-save");
check("sql templates were not edited by this phase",
  !saveTemplate.includes("gosaki_discography_operational_set_published") &&
    !createSql.includes("handleDiscographyCreateHttp") &&
    publishSql.includes("published = true"));

check("arm flags are exact true only",
  isDiscographyEdgeArmExactTrue("true") === true &&
    isDiscographyEdgeArmExactTrue(undefined) === false &&
    isDiscographyEdgeArmExactTrue("false") === false &&
    isDiscographyEdgeArmExactTrue("TRUE") === false);

const release = {
  title: "New Album",
  artist: "Artist",
  release_date: "2024-01-02",
  release_display: "Release 2024.1.2",
  label: "Label",
  catalog_number: "CAT-1",
  description: "line",
  price: "2,000 (tax in)",
  purchase_note: "会場",
  purchase_url: "https://example.com/buy",
  streaming_url: "http://example.com/listen",
  cover_image_url: "https://example.com/cover.jpg",
};
const created = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  release,
  trackTitles: [" One ", "", "Two"],
});
check("create payload matches the rpc arguments and omits legacy id",
  created.ok === true &&
    created.rpcArgs.p_site_slug === "gosaki-piano" &&
    created.rpcArgs.p_title === "New Album" &&
    created.rpcArgs.p_track_titles.join("|") === "One|Two" &&
    !Object.prototype.hasOwnProperty.call(created.rpcArgs, "p_legacy_id") &&
    !Object.prototype.hasOwnProperty.call(created.rpcArgs, "p_published"));
const legacy = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  release,
  trackTitles: [],
});
check("create rejects a caller legacy id", legacy.ok === false && legacy.reasonCode === "legacy_id_forbidden");
const published = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  release: { ...release, published: true },
  trackTitles: [],
});
check("create rejects caller published", published.ok === false && published.reasonCode === "published_forbidden");
const otherSite = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "other-site",
  release,
  trackTitles: [],
});
check("create rejects another site", otherSite.ok === false && otherSite.reasonCode === "site_mismatch");
const badApproval = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: "gosaki-discography-operational-save",
  siteSlug: "gosaki-piano",
  release,
  trackTitles: [],
});
check("create rejects the save approval id", badApproval.ok === false && badApproval.reasonCode === "approval_mismatch");
const scriptUrl = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  release: { ...release, purchase_url: "javascript:alert(1)" },
  trackTitles: [],
});
check("create rejects a javascript url", scriptUrl.ok === false && scriptUrl.reasonCode === "field_validation_failed");
const htmlTitle = validateDiscographyCreateRequest({
  operation: "create",
  approvalId: DISCOGRAPHY_CREATE_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  release: { ...release, title: "<b>no</b>" },
  trackTitles: [],
});
check("create rejects html", htmlTitle.ok === false && htmlTitle.field !== "ok" && htmlTitle.reasonCode === "field_validation_failed");

const publish = validateDiscographySetPublishedRequest({
  operation: "setPublished",
  approvalId: DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "2026-10-11T00:00:00.000Z",
  published: true,
});
check("setPublished accepts only the lock and true",
  publish.ok === true &&
    publish.rpcArgs.p_published === true &&
    publish.rpcArgs.p_legacy_id === "discography-005" &&
    Object.keys(publish.rpcArgs).sort().join(",") === "p_expected_before_updated_at,p_legacy_id,p_published,p_site_slug");
const unpublish = validateDiscographySetPublishedRequest({
  operation: "setPublished",
  approvalId: DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "2026-10-11T00:00:00.000Z",
  published: false,
});
check("setPublished rejects false", unpublish.ok === false && unpublish.reasonCode === "publish_only");
const extra = validateDiscographySetPublishedRequest({
  operation: "setPublished",
  approvalId: DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "2026-10-11T00:00:00.000Z",
  published: true,
  title: "nope",
});
check("setPublished rejects other columns", extra.ok === false && extra.reasonCode === "unexpected_payload");
const missingLock = validateDiscographySetPublishedRequest({
  operation: "setPublished",
  approvalId: DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "  ",
  published: true,
});
check("setPublished requires the optimistic lock", missingLock.ok === false && missingLock.reasonCode === "optimistic_lock_missing");
const wrongOp = validateDiscographySetPublishedRequest({
  operation: "save",
  approvalId: DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID,
  siteSlug: "gosaki-piano",
  legacyId: "discography-005",
  expectedBeforeUpdatedAt: "2026-10-11T00:00:00.000Z",
  published: true,
});
check("setPublished rejects operation save", wrongOp.ok === false && wrongOp.reasonCode === "operation_mismatch");

const conflict = mapDiscographyWriteRpcResult({
  ok: false,
  reason_code: "optimistic_lock_conflict",
  message: "expectedBeforeUpdatedAt does not match current updated_at",
  http_status: 409,
}, null);
check("lock conflict stays 409 and does not count as a write", conflict.status === 409 && conflict.didWrite === false && conflict.reasonCode === "optimistic_lock_conflict");
const already = mapDiscographyWriteRpcResult({
  ok: false,
  reason_code: "already_published",
  message: "published row was not changed",
  published: true,
  http_status: 422,
}, null);
check("already published stays 422", already.status === 422 && already.didWrite === false && already.reasonCode === "already_published");
const denied = mapDiscographyWriteRpcResult({
  ok: false,
  reason_code: "can_write_site_denied",
  message: "can_write_site(site_id) must be true",
  http_status: 403,
}, null);
check("permission denial stays 403", denied.status === 403 && denied.didWrite === false);
const createdRpc = mapDiscographyWriteRpcResult({
  ok: true,
  reason_code: "ok",
  legacy_id: "discography-005",
  published: false,
  sort_order: 5,
  track_count: 2,
  http_status: 200,
}, null);
check("create success returns the allocated id and published false",
  createdRpc.ok === true && createdRpc.legacyId === "discography-005" && createdRpc.published === false && createdRpc.didWrite === true);
const publishedRpc = mapDiscographyWriteRpcResult({
  ok: true,
  reason_code: "ok",
  legacy_id: "discography-005",
  published: true,
  updated_at: "2026-10-11T01:02:03.000Z",
  http_status: 200,
}, null);
check("setPublished success returns published true and updated_at",
  publishedRpc.ok === true && publishedRpc.published === true && publishedRpc.updatedAt === "2026-10-11T01:02:03.000Z");

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const name of failures) console.error(`- ${name}`);
  process.exit(1);
}
console.log("PASS 22");
