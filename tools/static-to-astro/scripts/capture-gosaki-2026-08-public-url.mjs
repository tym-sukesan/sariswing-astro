#!/usr/bin/env node
/**
 * G-20r1b — Limited public URL capture for gosaki-piano.com /2026-08
 *
 * Scope: single public GET only — no login, no crawl, no form submit.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/capture-gosaki-2026-08-public-url.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(TOOL_ROOT, "output/gosaki-source-captures/2026-08");

const TARGET_URL = "https://www.gosaki-piano.com/2026-08";
const TRAILING_SLASH_URL = "https://www.gosaki-piano.com/2026-08/";
const USER_AGENT =
  "CMS-Kit-Gosaki-Source-Capture/1.0 (G-20r1b; public-GET-only; read-only)";

/**
 * @param {string} html
 */
function htmlToPlainLines(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, "\n");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * @param {string[]} lines
 */
function extractAugustEvents(lines) {
  /** @type {Array<Record<string, string>>} */
  const events = [];
  const dateRe = /^2026\.08\.\d{2}/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!dateRe.test(line)) continue;

    const block = [line];
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      if (dateRe.test(lines[j])) break;
      if (lines[j].startsWith("©")) break;
      block.push(lines[j]);
    }

    const rawText = block.join("\n");
    const getField = (prefix) => {
      const row = block.find((b) => b.startsWith(prefix));
      return row ? row.slice(prefix.length).trim() : "";
    };

    const timeRaw = getField("時間：");
    let openTime = "";
    let startTime = "";
    if (timeRaw) {
      const openMatch = timeRaw.match(/開場\s*([0-9:.／/]+)/);
      const startMatch = timeRaw.match(/開演\s*([0-9:.／/]+)/);
      openTime = openMatch ? openMatch[1].trim() : "";
      startTime = startMatch ? startMatch[1].trim() : "";
    }

    const titleLine =
      block.find((b) => b.startsWith("<") && b.endsWith(">")) ||
      block.find((b) => b.includes("Leader Live")) ||
      "";

    events.push({
      source_order: String(events.length + 1),
      date: line.replace(/\s*\(.*\)\s*$/, "").trim(),
      weekday: (line.match(/\(([^)]+)\)/) || [])[1] || "",
      title: titleLine,
      venue: getField("会場："),
      time_raw: timeRaw,
      open_time: openTime,
      start_time: startTime,
      price: getField("料金："),
      performers: getField("出演："),
      venue_website:
        getField("会場website：") || getField("イベントwebsite：") || getField("出演者website："),
      description: block.find((b) => b.includes("Leader Live")) || "",
      raw_text: rawText,
      uncertainty_notes: "",
      intended_action: "insert",
    });
  }

  return events;
}

/**
 * @param {string} url
 */
async function fetchPublicGet(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  const body = await res.text();
  return {
    url,
    status: res.status,
    finalUrl: res.url,
    contentType: res.headers.get("content-type") || "",
    body,
    redirected: res.redirected,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const trailingProbe = await fetchPublicGet(TRAILING_SLASH_URL);
  const primary = await fetchPublicGet(TARGET_URL);

  const html = primary.body;
  const lines = htmlToPlainLines(html);
  const events = extractAugustEvents(lines);

  const extractedText = lines.join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "raw.html"), html, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "extracted-text.txt"), extractedText, "utf8");

  const summary = {
    taskId: "G-20r1b-gosaki-limited-public-url-capture",
    capturedAt: new Date().toISOString(),
    method: "public GET only",
    login: false,
    auth: false,
    formSubmission: false,
    recursiveCrawl: false,
    networkScope: "exact URL only",
    targetUrl: TARGET_URL,
    trailingSlashUrl: TRAILING_SLASH_URL,
    trailingSlashProbe: {
      status: trailingProbe.status,
      finalUrl: trailingProbe.finalUrl,
      redirected: trailingProbe.redirected,
    },
    primaryFetch: {
      status: primary.status,
      finalUrl: primary.finalUrl,
      contentType: primary.contentType,
      redirected: primary.redirected,
      byteLength: Buffer.byteLength(html, "utf8"),
    },
    outputFiles: {
      rawHtml: "raw.html",
      extractedText: "extracted-text.txt",
      captureSummary: "capture-summary.json",
    },
    eventCountDetected: events.length,
    detectedDates: events.map((e) => e.date),
    events,
    extractionConfidence: events.length > 0 ? "HIGH" : "LOW",
    playwrightUsed: false,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "capture-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
