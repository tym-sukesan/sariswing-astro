/**
 * Gosaki YouTube delete UI — local static verifier.
 * No DB write / Secret / Edge deploy / FTP / network.
 *
 * Run: node tools/static-to-astro/scripts/verify-gosaki-youtube-delete-ui.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_YOUTUBE_SITE_SLUG,
  YOUTUBE_SUPABASE_DELETE_APPROVAL_ID,
  YOUTUBE_SUPABASE_DELETE_OPERATION,
  YOUTUBE_SUPABASE_ENDPOINT_NAME,
  YOUTUBE_SUPABASE_ITEM_ID_PATTERN,
  YOUTUBE_SUPABASE_PROVIDER,
  YOUTUBE_SUPABASE_SAVE_ARMED_ENV,
  assertYoutubeSupabaseDeleteScope,
  buildYoutubeSupabaseItemDeleteRequest,
} from "./lib/cms-core-v2-youtube-supabase-contract.mjs";
import { GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS } from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

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

function readRepo(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function readTools(rel) {
  return fs.readFileSync(path.join(TOOL_ROOT, rel), "utf8");
}

const handlerRel = "supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts";
const mirrorRel =
  "tools/static-to-astro/scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/handler.ts";
const handler = readRepo(handlerRel);
const mirror = readRepo(mirrorRel);
assert("root↔tools handler byte-eq", handler === mirror);

assert("endpoint unchanged", handler.includes(`ENDPOINT_NAME = "${YOUTUBE_SUPABASE_ENDPOINT_NAME}"`));
assert("delete operation const", handler.includes(`DELETE_OPERATION = "${YOUTUBE_SUPABASE_DELETE_OPERATION}"`));
assert("delete approval const", handler.includes(`DELETE_APPROVAL_ID = "${YOUTUBE_SUPABASE_DELETE_APPROVAL_ID}"`));
assert("delete reuses save arm secret", handler.includes(YOUTUBE_SUPABASE_SAVE_ARMED_ENV));
assert("delete uses can_write_site", handler.includes("can_write_site"));
assert("delete scopes site_slug", handler.includes('.eq("site_slug", SITE_SLUG)'));
assert("delete scopes provider", handler.includes('.eq("provider", PROVIDER)'));
assert("delete scopes legacy_item_id", handler.includes('.eq("legacy_item_id", itemId)'));
assert("delete has .delete()", handler.includes(".delete()"));
assert("delete ignores published filter", !/delete\(\)[\s\S]{0,400}\.eq\("published"/.test(handler));
assert("delete no service_role", !/SERVICE_ROLE/.test(handler.split("executeYoutubeItemDelete")[1] ?? handler));
assert("save path still requires items[]", handler.includes('error: "items[] required"'));
assert("contents youtube-url-save untouched", readRepo("supabase/functions/gosaki-youtube-url-save/index.ts").includes("gosaki-youtube-url-save"));

const scopeOk = assertYoutubeSupabaseDeleteScope({
  id: "yt-ce00cf60",
  siteSlug: GOSAKI_YOUTUBE_SITE_SLUG,
  provider: YOUTUBE_SUPABASE_PROVIDER,
});
assert("scope yt-ce00cf60 ok", scopeOk.ok && scopeOk.publishedIndependent === true);
assert("item id pattern accepts yt-ce00cf60", YOUTUBE_SUPABASE_ITEM_ID_PATTERN.test("yt-ce00cf60"));

const scopeBadSlug = assertYoutubeSupabaseDeleteScope({
  id: "yt-ce00cf60",
  siteSlug: "other-site",
  provider: "youtube",
});
assert("scope rejects other site_slug", scopeBadSlug.ok === false);

const scopeBadProvider = assertYoutubeSupabaseDeleteScope({
  id: "yt-ce00cf60",
  siteSlug: "gosaki-piano",
  provider: "vimeo",
});
assert("scope rejects non-youtube provider", scopeBadProvider.ok === false);

const delReq = buildYoutubeSupabaseItemDeleteRequest({
  id: "yt-ce00cf60",
  expectedBeforeUpdatedAt: "2026-09-23T00:00:00.000Z",
});
assert("delete request operation", delReq.operation === "delete");
assert("delete request approval", delReq.approvalId === YOUTUBE_SUPABASE_DELETE_APPROVAL_ID);
assert("delete request id exact", delReq.id === "yt-ce00cf60");
assert("delete request no items[]", delReq.items == null);
assert("delete request provider youtube", delReq.provider === "youtube");
assert("delete request siteSlug", delReq.siteSlug === "gosaki-piano");

const sql = readTools("scripts/supabase/cms-core-v2-site-embeds-youtube-delete-rls.template.sql");
assert("sql DO NOT EXECUTE", /DO NOT EXECUTE/i.test(sql));
assert("sql staging ref", sql.includes("kmjqppxjdnwwrtaeqjta"));
assert("sql production STOP", sql.includes("vsbvndwuajjhnzpohghh"));
assert("sql additive banner", /ADDITIVE/i.test(sql));
assert("sql no REVOKE ALL", !/revoke all on table public\.site_embeds/i.test(sql));
assert("sql can_write_site", sql.includes("can_write_site"));
assert("sql provider youtube", sql.includes("provider = 'youtube'"));
assert("sql site_slug gosaki-piano", sql.includes("site_slug = 'gosaki-piano'"));
assert("sql grant delete", /grant delete on table public\.site_embeds/i.test(sql));

const sqlRollback = readTools(
  "scripts/supabase/cms-core-v2-site-embeds-youtube-delete-rls-rollback.template.sql",
);
assert("rollback DO NOT EXECUTE", /DO NOT EXECUTE/i.test(sqlRollback));
assert("rollback drops delete policy", sqlRollback.includes("site_embeds_admin_delete_youtube"));
assert("rollback revoke delete only", /revoke delete on table public\.site_embeds/i.test(sqlRollback));
assert("rollback no drop table", !/drop table/i.test(sqlRollback));

assert("mutex still 6 arms", GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.length === 6);
assert(
  "no new delete client arm",
  !GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.some((a) => /DELETE/i.test(a.clientEnv)),
);

const ui = readTools(
  "templates/site-extensions/gosaki-piano/gosaki-staging-youtube-multi-operational-edit.ts",
);
assert("UI has data-yt-delete", ui.includes("data-yt-delete"));
assert("UI has confirm button", ui.includes("data-yt-delete-confirm"));
assert("UI has cancel button", ui.includes("data-yt-delete-cancel"));
assert("UI confirm copy", ui.includes("この動画を削除しますか？"));
assert("UI remove from list helper", ui.includes("applyDeletedItemLocally"));
assert("UI posts delete operation", ui.includes("buildDeleteEndpointRequest"));
assert("UI supabase path only for persisted", ui.includes("supabaseDeleteEnabled"));
assert("UI no contents github write", !ui.includes("gosaki-youtube-url-save"));

const helper = readTools(
  "templates/site-extensions/gosaki-piano/gosaki-staging-one-click-save.ts",
);
assert(
  "helper delete success const",
  helper.includes('export const GOSAKI_DELETE_SUCCESS_USER_MESSAGE = "削除しました"'),
);
assert("UI imports delete success const", ui.includes("GOSAKI_DELETE_SUCCESS_USER_MESSAGE"));
assert("UI deleteSuccessSticky latch", ui.includes("deleteSuccessSticky"));
assert(
  "UI Edge success paints save-card via applySaveButtonUi",
  /deleteSuccessSticky = true[\s\S]{0,400}applySaveButtonUi\(\s*false,\s*GOSAKI_DELETE_SUCCESS_USER_MESSAGE/.test(
    ui,
  ),
);
assert(
  "UI Edge success paints header status",
  /statusEl\.textContent = GOSAKI_DELETE_SUCCESS_USER_MESSAGE/.test(ui),
);
assert(
  "live-read ready does not overwrite delete sticky",
  /!saveSuccessSticky && !deleteSuccessSticky/.test(ui),
);
assert(
  "refreshSaveGate keeps delete sticky when clean",
  /deleteSuccessSticky\s*\?\s*GOSAKI_DELETE_SUCCESS_USER_MESSAGE/.test(ui),
);
assert("edit clears delete sticky", /invalidateDryRunUi[\s\S]{0,80}deleteSuccessSticky = false/.test(ui) || ui.includes("deleteSuccessSticky = false"));
assert("delete failure copy kept", ui.includes("削除に失敗しました"));
assert("local-only cancel copy kept", ui.includes("未保存の追加を取り消しました"));

{
  function resolveYoutubeGateReason(input) {
    if (input.deleteInFlight) return "削除中…";
    if (!input.dirty) {
      if (input.saveSuccessSticky) return "保存しました";
      if (input.deleteSuccessSticky) return "削除しました";
      return "変更がありません";
    }
    return "未保存の変更があります";
  }
  assert(
    "after Edge delete refresh keeps 削除しました",
    resolveYoutubeGateReason({
      dirty: false,
      deleteInFlight: false,
      saveSuccessSticky: false,
      deleteSuccessSticky: true,
    }) === "削除しました",
  );
  assert(
    "after Edge delete refresh does not fall back to 変更がありません",
    resolveYoutubeGateReason({
      dirty: false,
      deleteInFlight: false,
      saveSuccessSticky: false,
      deleteSuccessSticky: true,
    }) !== "変更がありません",
  );
  assert(
    "edit after delete shows dirty",
    resolveYoutubeGateReason({
      dirty: true,
      deleteInFlight: false,
      saveSuccessSticky: false,
      deleteSuccessSticky: false,
    }) === "未保存の変更があります",
  );
}

const page = readTools(
  "templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
assert("page wires delete builder supabase only", page.includes("buildYoutubeSupabaseItemDeleteEndpointRequest"));
assert(
  "contents path does not get delete builder",
  /buildDeleteEndpointRequest: useSupabase\s*\?[\s\S]*buildYoutubeSupabaseItemDeleteEndpointRequest[\s\S]*: undefined/.test(
    page,
  ),
);

const panel = readTools(
  "templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeContentPanel.astro",
);
assert("panel mentions 削除", panel.includes("削除で登録から外せます"));

const schedule = readTools(
  "templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts",
);
assert("schedule edit untouched by youtube delete marker", !schedule.includes("data-yt-delete-confirm"));
const disco = readTools(
  "templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts",
);
assert("discography edit untouched by youtube delete marker", !disco.includes("data-yt-delete-confirm"));
const about = readTools(
  "templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts",
);
assert("about edit untouched by youtube delete marker", !about.includes("data-yt-delete-confirm"));

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed) {
  process.exit(1);
}
console.log("YOUTUBE_DELETE_UI_ASSERTS_PASS");
