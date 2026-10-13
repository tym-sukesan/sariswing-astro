#!/usr/bin/env node
/**
 * Gosaki Discography cover upload — offline checks.
 * No Storage write, no DB write, no Edge deploy, no production build, no FTP.
 *
 * Run: node scripts/verify-gosaki-discography-cover-upload.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function readRel(rel) {
  return fs.readFileSync(path.join(TOOL_ROOT, rel), "utf8");
}

const upload = readRel("templates/site-extensions/gosaki-piano/gosaki-discography-cover-upload.ts");
const opEdit = readRel("templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts");
const panel = readRel("templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro");
const applySrc = readRel("scripts/lib/gosaki-staging-read-only-admin.mjs");
const sql = readRel("scripts/supabase/cms-core-v2-site-assets-gosaki-piano-discography-insert.template.sql");
const rollback = readRel(
  "scripts/supabase/cms-core-v2-site-assets-gosaki-piano-discography-insert-rollback.template.sql",
);
const renderer = readRel("scripts/lib/gosaki-discography-public-list-render.mjs");

assert("optimizes with canvas webp instead of the schedule encoder", upload.includes('imageOrientation: "from-image"') && upload.includes("canvas.toBlob") && upload.includes("0.85") && upload.includes("GOSAKI_DISCOGRAPHY_COVER_MAX_EDGE = 1200") && !upload.includes("gosaki-schedule-image-upload") && !upload.includes("fillRect"));
assert("bucket is site-assets", upload.includes('GOSAKI_DISCOGRAPHY_COVER_BUCKET = "site-assets"'));
assert("path prefix is gosaki-piano/discography/", upload.includes('GOSAKI_DISCOGRAPHY_COVER_PATH_PREFIX = "gosaki-piano/discography/"'));
assert("does not target the historical gosaki/discography cover path", upload.includes('path.startsWith("gosaki/discography/")'));
assert("random object name", upload.includes("crypto.randomUUID()"));
assert("upsert false", upload.includes('"x-upsert": "false"'));
assert("no service_role", !upload.includes("service_role") && !opEdit.includes("service_role"));
assert("kmjq only", upload.includes("kmjqppxjdnwwrtaeqjta"));
assert("vsbvnd stopped", upload.includes("vsbvndwuajjhnzpohghh"));
assert("jwt bearer", upload.includes("Authorization: `Bearer ${accessToken}`"));
assert("raw size cap", upload.includes("GOSAKI_DISCOGRAPHY_COVER_RAW_MAX_BYTES = 12 * 1024 * 1024"));
assert("401 and 403 are permission failures", upload.includes("res.status === 401 || res.status === 403"));
assert("no storage delete", !upload.includes(".remove(") && !upload.includes("method: \"DELETE\""));

assert("create and edit upload buttons", panel.includes('data-gosaki-disc-cover-upload="create"') && panel.includes('data-gosaki-disc-cover-upload="edit"'));
assert("button label", panel.includes("ジャケット画像をアップロード"));
assert("url fields remain", panel.includes('data-gosaki-disc-create-field="cover_image_url"') && panel.includes('data-gosaki-disc-extra-field="cover_image_url"'));
assert("accept jpeg png webp", panel.includes("image/jpeg,image/png,image/webp"));
assert("status regions", panel.includes('data-gosaki-disc-cover-upload-status="create"') && panel.includes('data-gosaki-disc-cover-upload-status="edit"'));
assert("mobile upload stack", panel.includes("@media (max-width: 640px)"));
assert("public update stays separate", panel.includes("公開サイトを更新"));

assert("client imports upload helper", opEdit.includes("gosaki-discography-cover-upload"));
assert("checks file bytes before upload", upload.includes("assertCoverFileSignature") && upload.includes("sniffCoverBytes"));
assert("releases decoded bitmap and does not keep object urls", upload.includes("bitmap.close?.()") && !upload.includes("createObjectURL") && !opEdit.includes("createObjectURL"));
assert("browser size cap is not described as the server policy", sql.includes("NOT the server"));
assert("file select does not upload", (() => {
  const at = opEdit.indexOf("画像を選択しました");
  return at >= 0 && !opEdit.slice(at, at + 240).includes("uploadGosakiDiscographyCover");
})());
assert("status phases", opEdit.includes("画像を最適化しています") && opEdit.includes("アップロードしています") && opEdit.includes("アップロード完了"));
assert("upload writes the url field after success", opEdit.includes("input.value = publicUrl"));
assert("failure restores the previous url", opEdit.includes("input.value = previousUrl"));
assert("new albums use the new folder", opEdit.includes('legacyId: which === "edit" ? readFormSnapshot(form).legacyId : "new"'));
assert("does not auto-save or publish", !/runCoverUpload[\s\S]{0,1800}executeSaveAfterDryRun/.test(opEdit) && !opEdit.includes("runGosakiDiscographySetPublishedEdgeAttempt(publicUrl)"));
assert("apply copies the module", applySrc.includes("gosaki-discography-cover-upload.ts"));
assert("renderer untouched by upload helper", !renderer.includes("uploadGosakiDiscographyCover"));

assert("sql is insert only for authenticated", sql.includes("for insert") && sql.includes("to authenticated") && !sql.includes("for update") && !sql.includes("for delete"));
assert("sql requires can_write_site", sql.includes("public.can_write_site(site_row.id)"));
assert("sql prefix is gosaki-piano/discography/", sql.includes("gosaki-piano/discography/%"));
assert("sql does not grant or drop other policies", !sql.includes("grant ") && !sql.includes("drop policy"));
assert("sql is not applied by this file", sql.includes("DO NOT EXECUTE"));
assert("rollback drops only the new policy", rollback.includes("drop policy if exists site_assets_gosaki_piano_discography_insert"));

const mod = await import(
  "../templates/site-extensions/gosaki-piano/gosaki-discography-cover-upload.ts"
);
const supabaseUrl = "https://kmjqppxjdnwwrtaeqjta.supabase.co";

function imageFile(kind, length, name, type = kind === "jpeg" ? "image/jpeg" : kind === "png" ? "image/png" : "image/webp") {
  const bytes = new Uint8Array(length);
  if (kind === "jpeg") bytes.set([0xff, 0xd8, 0xff], 0);
  if (kind === "png") bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  if (kind === "gif") bytes.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
  if (kind === "webp") {
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  }
  return new File([bytes], name, { type });
}

const draftPath = mod.buildGosakiDiscographyCoverObjectPath("", ".webp", "abcd1234ef567890");
assert("empty legacy id uses new/", draftPath.startsWith("gosaki-piano/discography/new/"));
assert("traversal legacy id cannot leave the prefix", mod.buildGosakiDiscographyCoverObjectPath("../../gosaki/discography/discography-001/cover.jpg", ".jpg", "abcd1234ef567890").startsWith("gosaki-piano/discography/"));
let rejectedFixedCover = false;
try {
  mod.assertGosakiDiscographyCoverObjectPath("gosaki-piano/discography/discography-001/cover.jpg");
} catch {
  rejectedFixedCover = true;
}
assert("historical cover.jpg name is rejected", rejectedFixedCover);
let rejectedOtherProject = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: new File(["x"], "a.jpg", { type: "image/jpeg" }),
    supabaseUrl: "https://vsbvndwuajjhnzpohghh.supabase.co",
    anonKey: "anon",
    accessToken: "jwt",
    legacyId: "discography-001",
    fetchImpl: async () => {
      throw new Error("network must not be called");
    },
  });
} catch (error) {
  rejectedOtherProject = error instanceof Error && error.message.includes("不正");
}
assert("wrong project is rejected before upload", rejectedOtherProject);

let fetchCalled = false;
let gifRejected = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: new File(["GIF89a"], "a.gif", { type: "image/gif" }),
    supabaseUrl,
    anonKey: "anon",
    accessToken: "jwt",
    legacyId: "discography-001",
    fetchImpl: async () => {
      fetchCalled = true;
      return new Response("no", { status: 201 });
    },
  });
} catch {
  gifRejected = true;
}
assert("gif is rejected before storage", gifRejected && !fetchCalled);

let oversizedRejected = false;
fetchCalled = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: new File([new Uint8Array(12 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" }),
    supabaseUrl,
    anonKey: "anon",
    accessToken: "jwt",
    legacyId: "discography-001",
    fetchImpl: async () => {
      fetchCalled = true;
      return new Response("no", { status: 201 });
    },
  });
} catch (error) {
  oversizedRejected = error instanceof Error && error.message.includes("大きすぎます");
}
assert("oversized file is rejected before storage", oversizedRejected && !fetchCalled);

let postedPath = "";
let postedUpsert = "";
let postedAuth = "";
let postedType = "";
let phases = [];
const publicUrl = await mod.uploadGosakiDiscographyCover({
  file: imageFile("jpeg", 32, "cover.jpg"),
  supabaseUrl,
  anonKey: "anon-key",
  accessToken: "user-jwt",
  legacyId: "discography-001",
  optimizeImpl: async () => ({
    file: new File(["jpeg"], "cover.webp", { type: "image/webp" }),
    extension: ".webp",
    mimeType: "image/webp",
  }),
  onPhase(phase) {
    phases.push(phase);
  },
  fetchImpl: async (endpoint, init) => {
    postedPath = String(endpoint);
    postedUpsert = String(init?.headers?.["x-upsert"] ?? "");
    postedAuth = String(init?.headers?.Authorization ?? "");
    postedType = String(init?.headers?.["Content-Type"] ?? "");
    return new Response("{}", { status: 200 });
  },
});
assert("success posts a new discography object", postedPath.includes("/storage/v1/object/site-assets/gosaki-piano/discography/discography-001/") && postedPath.endsWith(".webp"));
assert("success sends image/webp", postedType === "image/webp");
assert("success optimizes before upload", phases.join(",") === "optimize,upload");
assert("success does not use upsert", postedUpsert === "false");
assert("success uses the user jwt", postedAuth === "Bearer user-jwt");
assert("success returns the public url", publicUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/site-assets/gosaki-piano/discography/discography-001/`) && publicUrl.endsWith(".webp"));

let denied = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: imageFile("jpeg", 32, "cover.jpg"),
    supabaseUrl,
    anonKey: "anon-key",
    accessToken: "user-jwt",
    legacyId: "discography-002",
    optimizeImpl: async () => ({
      file: new File(["jpeg"], "cover.webp", { type: "image/webp" }),
      extension: ".webp",
      mimeType: "image/webp",
    }),
    fetchImpl: async () => new Response("{}", { status: 403 }),
  });
} catch (error) {
  denied = error instanceof Error && error.message.includes("権限がありません");
}
assert("storage 403 does not return a url", denied);

let networkFailed = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: imageFile("jpeg", 32, "cover.jpg"),
    supabaseUrl,
    anonKey: "anon-key",
    accessToken: "user-jwt",
    legacyId: "new",
    optimizeImpl: async () => ({
      file: new File(["jpeg"], "cover.webp", { type: "image/webp" }),
      extension: ".webp",
      mimeType: "image/webp",
    }),
    fetchImpl: async () => {
      throw new TypeError("failed");
    },
  });
} catch (error) {
  networkFailed = error instanceof Error && error.message.includes("通信に失敗しました");
}
assert("network failure throws without a url", networkFailed);

const wide = mod.coverTargetSize(2000, 1000);
const small = mod.coverTargetSize(800, 400);
const exact = mod.coverTargetSize(1200, 900);
const tall = mod.coverTargetSize(100, 3000);
assert("long edge shrinks to 1200 and keeps aspect", wide.width === 1200 && wide.height === 600);
assert("smaller images are not enlarged", small.width === 800 && small.height === 400);
assert("1200px edge stays unchanged", exact.width === 1200 && exact.height === 900);
assert("portrait long edge stays 1200", tall.width === 40 && tall.height === 1200);

let encodeCalls = [];
const optimized = await mod.optimizeGosakiDiscographyCover(
  imageFile("png", 1800, "cover.png"),
  {
    decode: async () => ({ width: 2400, height: 1200, close() {} }),
    encodeWebp: async (size, quality) => {
      encodeCalls.push({ size, quality });
      return new Blob([new Uint8Array(420 * 1024)], { type: "image/webp" });
    },
  },
);
assert("webp quality stays 0.85 when already under 2MB", encodeCalls.length === 1 && encodeCalls[0].quality === 0.85);
assert("optimizer scales before encoding", encodeCalls[0].size.width === 1200 && encodeCalls[0].size.height === 600);
assert("optimizer returns webp bytes", optimized.mimeType === "image/webp" && optimized.extension === ".webp" && optimized.file.type === "image/webp" && optimized.beforeBytes === 1800 && optimized.afterBytes === 420 * 1024);

let floorUsed = false;
const capped = await mod.optimizeGosakiDiscographyCover(
  imageFile("png", 2000, "big.png"),
  {
    decode: async () => ({ width: 4000, height: 2000, close() {} }),
    encodeWebp: async (_size, quality) => {
      if (quality === 0.85) return new Blob([new Uint8Array(3 * 1024 * 1024)], { type: "image/webp" });
      floorUsed = quality === 0.75;
      return new Blob([new Uint8Array(900 * 1024)], { type: "image/webp" });
    },
  },
);
assert("2MB cap may step to 0.75 once", floorUsed && capped.afterBytes === 900 * 1024);

let stillTooBig = false;
try {
  await mod.optimizeGosakiDiscographyCover(
    imageFile("png", 2000, "big.png"),
    {
      decode: async () => ({ width: 2000, height: 2000, close() {} }),
      encodeWebp: async () => new Blob([new Uint8Array(3 * 1024 * 1024)], { type: "image/webp" }),
    },
  );
} catch (error) {
  stillTooBig = error instanceof Error && error.message.includes("2MB");
}
assert("still-too-large webp is not accepted", stillTooBig);

let webpFailed = false;
try {
  await mod.optimizeGosakiDiscographyCover(
    imageFile("png", 100, "a.png"),
    {
      decode: async () => ({ width: 100, height: 80, close() {} }),
      encodeWebp: async () => new Blob([new Uint8Array(20)], { type: "image/png" }),
    },
  );
} catch (error) {
  webpFailed = error instanceof Error && error.message.includes("WebPに変換できない");
}
assert("non-webp encode is rejected", webpFailed);

let broken = false;
try {
  await mod.optimizeGosakiDiscographyCover(
    imageFile("jpeg", 32, "broken.jpg"),
    {
      decode: async () => {
        throw new Error("decode failed");
      },
    },
  );
} catch (error) {
  broken = error instanceof Error && error.message === "画像を読み込めませんでした。";
}
assert("unreadable image is rejected", broken);

let originalPosted = false;
let originalRejected = false;
try {
  await mod.uploadGosakiDiscographyCover({
    file: imageFile("jpeg", 32, "cover.jpg"),
    supabaseUrl,
    anonKey: "anon-key",
    accessToken: "user-jwt",
    legacyId: "discography-001",
    optimizeImpl: async () => ({
      file: imageFile("jpeg", 32, "cover.jpg"),
      extension: ".jpg",
      mimeType: "image/jpeg",
    }),
    fetchImpl: async () => {
      originalPosted = true;
      return new Response("{}", { status: 200 });
    },
  });
} catch (error) {
  originalRejected = error instanceof Error && error.message.includes("WebPに変換できない");
}
assert("original jpeg is not uploaded when webp conversion fails", originalRejected && !originalPosted);

const square = mod.coverTargetSize(1800, 1800);
assert("square above 1200 scales to 1200", square.width === 1200 && square.height === 1200);
const squareSmall = mod.coverTargetSize(640, 640);
assert("square at or below 1200 is not enlarged", squareSmall.width === 640 && squareSmall.height === 640);

const transparent = { width: 400, height: 800, close() {} };
let receivedBitmap = null;
await mod.optimizeGosakiDiscographyCover(imageFile("png", 64, "alpha.png"), {
  decode: async () => transparent,
  encodeWebp: async (_size, _quality, bitmap) => {
    receivedBitmap = bitmap;
    return new Blob([new Uint8Array(30)], { type: "image/webp" });
  },
});
assert("transparent png bitmap is encoded without a background fill", receivedBitmap === transparent && !upload.includes("fillRect") && !upload.includes("fillStyle"));

const gifBytes = new Uint8Array(16);
gifBytes.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
assert("gif bytes are not accepted as jpeg", mod.sniffCoverBytes(gifBytes) === null);
let renamedGif = false;
try {
  await mod.assertCoverFileSignature(new File([gifBytes], "photo.jpg", { type: "image/jpeg" }));
} catch (error) {
  renamedGif = error instanceof Error && error.message.includes("形式を確認できませんでした");
}
assert("renamed gif is rejected from its bytes", renamedGif);

let newPosted = "";
await mod.uploadGosakiDiscographyCover({
  file: imageFile("jpeg", 32, "cover.jpg"),
  supabaseUrl,
  anonKey: "anon-key",
  accessToken: "user-jwt",
  legacyId: "",
  optimizeImpl: async () => ({
    file: new File(["webp"], "cover.webp", { type: "image/webp" }),
    extension: ".webp",
    mimeType: "image/webp",
    width: 800,
    height: 800,
    beforeBytes: 32,
    afterBytes: 4,
  }),
  fetchImpl: async (url) => {
    newPosted = String(url);
    return new Response(JSON.stringify({ Key: "site-assets/gosaki-piano/discography/new/abcd.webp" }), { status: 200 });
  },
});
assert("new album uploads under discography/new/", newPosted.includes("/gosaki-piano/discography/new/") && newPosted.endsWith(".webp"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
