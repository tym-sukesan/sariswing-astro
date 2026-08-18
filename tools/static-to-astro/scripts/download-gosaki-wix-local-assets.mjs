#!/usr/bin/env node
/**
 * One-shot download of Gosaki Wix CDN media listed in the localization manifest.
 * Saves bytes as-is (no recompress). Prefers JPEG/PNG over AVIF negotiate.
 *
 * Usage: node scripts/download-gosaki-wix-local-assets.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { loadGosakiWixLocalManifest, TOOL_ROOT } from "./lib/gosaki-wix-local-assets.mjs";

function candidates(url) {
  const stripped = url.replace(/,enc_avif,quality_auto/g, "");
  return stripped === url ? [url] : [stripped, url];
}

async function download(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "gosaki-wix-local-assets/1.0 (localization)",
      Accept: "image/jpeg,image/png,image/webp,image/x-icon,image/vnd.microsoft.icon,*/*",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, contentType: res.headers.get("content-type") || "", finalUrl: res.url };
}

function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "png";
  }
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    return "ico";
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") return "avif-or-mp4";
  if (buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "RIFF") return "webp";
  return "unknown";
}

const manifest = loadGosakiWixLocalManifest(TOOL_ROOT);
const destDir = path.join(TOOL_ROOT, manifest.sourceDir);
fs.mkdirSync(destDir, { recursive: true });

let ok = 0;
let fail = 0;
for (const asset of manifest.assets) {
  const dest = path.join(destDir, asset.file);
  let lastErr = null;
  let saved = false;
  for (const url of candidates(asset.downloadUrl)) {
    try {
      const { buf, contentType } = await download(url);
      const kind = sniff(buf);
      if (kind === "avif-or-mp4") {
        lastErr = new Error(`got AVIF/mp4 for ${asset.file} (${contentType})`);
        continue;
      }
      fs.writeFileSync(dest, buf);
      ok += 1;
      saved = true;
      console.log(`OK ${asset.file} ${buf.length}B ${contentType} sniff=${kind}`);
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!saved) {
    fail += 1;
    console.error(`FAIL ${asset.file} ${lastErr?.message || lastErr}`);
  }
}

console.log(`done ok=${ok} fail=${fail} dir=${path.relative(TOOL_ROOT, destDir)}`);
if (fail) process.exit(1);
