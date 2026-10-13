#!/usr/bin/env node
/**
 * Local Discography create UI. No database and no network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  gosakiDiscographyCreateCoverPreviewUrl,
  gosakiDiscographyCreateSaveBar,
  gosakiDiscographyPanelModeAfter,
  parseGosakiDiscographyCreateTrackTitles,
  validateGosakiDiscographyCreateInput,
} from "../templates/site-extensions/gosaki-piano/gosaki-discography-create-draft.ts";

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

const panel = read("templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro");
const client = read("templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts");
const draft = read("templates/site-extensions/gosaki-piano/gosaki-discography-create-draft.ts");
const saveRpc = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql"),
  "utf8",
);
const saveTemplate = read("scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql");
const applySrc = read("scripts/lib/gosaki-staging-read-only-admin.mjs");

const createFn = client.slice(
  client.indexOf("const presentCreateLocalDryRun"),
  client.indexOf("const enterEdit"),
);
const saveClickStart = client.indexOf("await presentCreateLocalDryRun();");
const saveClick = client.slice(saveClickStart, saveClickStart + 500);
const editableKeys = client.slice(
  client.indexOf("const EDITABLE_KEYS"),
  client.indexOf("function readAlbumsJson"),
);

assert("create button sits on the list view", panel.includes("data-gosaki-disc-create-start") && panel.includes("作品を追加"));
assert("create reuses the existing form and save bar", panel.includes("data-gosaki-disc-edit-form") && panel.includes("gosaki-admin-save-area") && panel.includes("data-gosaki-disc-save"));
assert("one save button remains", (panel.match(/data-gosaki-disc-save(?!-)/g) || []).length === 1);
assert("edit cancel label remains in the panel", panel.includes("編集をやめる"));
assert("edit cover upload remains beside the URL field", panel.includes('data-gosaki-disc-cover-upload="edit"') && panel.includes('data-gosaki-disc-extra-field="cover_image_url"'));
assert("create fields are hidden until create mode", panel.includes('data-gosaki-disc-create-only hidden'));
assert(
  "create accepts the new text fields and track textarea",
  ["release_display", "catalog_number", "price", "purchase_note", "streaming_url", "cover_image_url"].every((name) =>
    panel.includes(`data-gosaki-disc-create-field="${name}"`),
  ) && panel.includes('data-gosaki-disc-field="tracks"'),
);
assert("create has a cover preview and a jpeg/png/webp file input", panel.includes("data-gosaki-disc-create-cover-preview") && panel.includes('data-gosaki-disc-cover-file="create"') && panel.includes("image/jpeg,image/png,image/webp"));
assert("published and legacy id stay out of the visible create fields", !panel.includes('data-gosaki-disc-create-field="published"') && !panel.includes('data-gosaki-disc-create-field="legacy_id"'));

assert("mode switches among view, create, and edit", gosakiDiscographyPanelModeAfter("create") === "create" && gosakiDiscographyPanelModeAfter("edit") === "edit" && gosakiDiscographyPanelModeAfter("cancel") === "view");
assert("client opens create without the edit save path", client.includes('data-gosaki-disc-create-start') && client.includes('discographyFormMode = "create"') && client.includes("resetCreateChrome()"));
assert("create dry-run does not fetch", createFn.includes("validateGosakiDiscographyCreateInput") && !createFn.includes("fetch("));
assert(
  "save click returns before the existing edit save",
  saveClick.includes("return;") &&
    client.lastIndexOf("await executeSaveAfterDryRun()") > saveClickStart,
);
assert("existing edit save still posts", client.includes("await fetch(saveEndpoint,") && client.includes("buildSaveEndpointRequest"));
assert("edit dirty keys are unchanged", editableKeys.includes('"title"') && editableKeys.includes('"tracks"') && !editableKeys.includes("price") && !editableKeys.includes("release_display"));
assert("draft module does not fetch", !draft.includes("fetch(") && !draft.includes("XMLHttpRequest"));
assert("package copies the create draft next to the edit client", applySrc.includes("gosaki-discography-create-draft.ts"));
assert("existing save SQL does not gain the create function", !saveRpc.includes("gosaki_discography_operational_create") && !saveTemplate.includes("gosaki_discography_operational_create"));

const emptyBar = gosakiDiscographyCreateSaveBar({
  dirty: false,
  inFlight: false,
  validationMessage: "",
  confirmed: false,
});
assert("empty create save bar stays disabled", emptyBar.enabled === false && emptyBar.reason === "変更がありません");
const dirtyBar = gosakiDiscographyCreateSaveBar({
  dirty: true,
  inFlight: false,
  validationMessage: "",
  confirmed: false,
});
assert("dirty create save bar can run the local check", dirtyBar.enabled === true && dirtyBar.reason === "未保存の変更があります");
const flightBar = gosakiDiscographyCreateSaveBar({
  dirty: true,
  inFlight: true,
  validationMessage: "",
  confirmed: false,
});
assert("create save bar shows the in-flight state", flightBar.enabled === false && flightBar.inFlightVisible === true && flightBar.reason === "保存中…");
const errorBar = gosakiDiscographyCreateSaveBar({
  dirty: true,
  inFlight: false,
  validationMessage: "タイトルを確認してください",
  confirmed: false,
});
assert("create save bar shows validation", errorBar.validationVisible === true && errorBar.reason === "入力内容を確認してください");

const tracks = parseGosakiDiscographyCreateTrackTitles(" Alpha \n\nBeta\r\n  \nGamma ");
assert("track textarea keeps order and skips blank lines", tracks.ok === true && tracks.titles.join("|") === "Alpha|Beta|Gamma");
const htmlTrack = parseGosakiDiscographyCreateTrackTitles("safe\n<script>");
assert("track titles reject html", htmlTrack.ok === false && htmlTrack.reasonCode === "tracks_validation_failed");
const tooMany = parseGosakiDiscographyCreateTrackTitles(Array.from({ length: 101 }, (_, i) => `t${i}`).join("\n"));
assert("track list stops at 100", tooMany.ok === false);

const input = {
  title: " New Album ",
  artist: "Artist",
  releaseDate: "2024-01-02",
  releaseDisplay: "Release 2024.1.2",
  label: "Label",
  catalogNumber: "CAT-1",
  price: "2,500(tax in)",
  purchaseNote: "会場でご購入いただけます",
  description: "line\nline",
  purchaseUrl: " https://example.com/buy ",
  streamingUrl: "http://example.com/listen",
  coverImageUrl: "https://example.com/cover.jpg",
  trackListText: " One \n\nTwo ",
};
const valid = validateGosakiDiscographyCreateInput(input);
assert("valid create payload is a local dry-run", valid.ok === true && valid.payload.dryRun === true && valid.payload.networkWrite === false);
assert("payload matches the create RPC arguments", valid.ok === true && valid.payload.rpc === "gosaki_discography_operational_create" && valid.payload.published === false && valid.payload.args.p_site_slug === "gosaki-piano" && valid.payload.args.p_title === "New Album" && valid.payload.args.p_track_titles.join("|") === "One|Two" && valid.payload.args.p_purchase_url === "https://example.com/buy" && valid.payload.args.p_description === "line\nline");
assert("payload does not accept a caller legacy id", valid.ok === true && !Object.prototype.hasOwnProperty.call(valid.payload, "legacy_id") && !Object.prototype.hasOwnProperty.call(valid.payload.args, "p_legacy_id") && !Object.prototype.hasOwnProperty.call(valid.payload.args, "p_published"));
assert("https cover can be previewed", gosakiDiscographyCreateCoverPreviewUrl(input.coverImageUrl) === input.coverImageUrl);

const missingTitle = validateGosakiDiscographyCreateInput({ ...input, title: "  " });
assert("title is required", missingTitle.ok === false && missingTitle.field === "title");
const htmlTitle = validateGosakiDiscographyCreateInput({ ...input, title: "<b>no</b>" });
assert("html in a text field is rejected", htmlTitle.ok === false && htmlTitle.field === "title");
const scriptUrl = validateGosakiDiscographyCreateInput({ ...input, purchaseUrl: "javascript:alert(1)" });
assert("javascript urls are rejected", scriptUrl.ok === false && scriptUrl.field === "purchase_url");
const badCover = gosakiDiscographyCreateCoverPreviewUrl("javascript:alert(1)");
assert("javascript cover is not previewed", badCover === null);
const badDate = validateGosakiDiscographyCreateInput({ ...input, releaseDate: "2024-13-01" });
assert("impossible release dates are rejected", badDate.ok === false && badDate.field === "release_date");
const emptyTracks = validateGosakiDiscographyCreateInput({ ...input, trackListText: "\n  \n" });
assert("blank track list still builds an empty title array", emptyTracks.ok === true && emptyTracks.payload.args.p_track_titles.length === 0);

console.log(`\nPASS ${passed}`);
if (failed > 0) {
  console.error(`FAIL ${failed}`);
  process.exit(1);
}
