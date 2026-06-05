/**
 * Site audit tool — captures public page data for Astro rebuild planning.
 * Run: npm run audit:site
 */
import { chromium, type BrowserContext } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESKTOP_VIEWPORT, getMobileDeviceOptions, MOBILE_DEVICE_NAME } from "./audit-config.ts";
import { detectServices } from "./detect-services.ts";
import { extractMetadataFromHtml } from "./extract-metadata.ts";
import { writeImplementationBrief } from "./generate-implementation-brief.ts";
import { writeMigrationBrief } from "./generate-migration-brief.ts";
import { summarizeAssetMap, writeAssetMap } from "./generate-asset-map.ts";
import { writeRebuildPrompt } from "./generate-rebuild-prompt.ts";
import {
  getPathname,
  inferPageType,
  isScheduleMonthPath,
  urlToAstroRoute,
} from "./page-analysis.ts";
import { prepareViewportForCapture } from "./page-prepare.ts";
import { extractRenderedEventBlocks } from "./rendered-event-blocks.ts";
import { extractRenderedAssets } from "./rendered-assets.ts";
import type {
  AuditFailure,
  AuditMetadata,
  AuditResult,
  AuditSuccess,
  PageMetadata,
} from "./audit-site-types.ts";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const URLS_FILE = path.join(TOOL_DIR, "urls.txt");
const OUTPUT_DIR = path.join(TOOL_DIR, "output");

function urlToSlug(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);
    const host = parsed.hostname.replace(/^www\./i, "");
    const pathname = parsed.pathname.replace(/\/+$/, "");
    const combined = pathname && pathname !== "/" ? `${host}${pathname}` : host;
    return combined
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "page";
  } catch {
    return "invalid-url";
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveAgainstBase(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function absolutizeMetadata(metadata: PageMetadata, baseUrl: string): PageMetadata {
  return {
    ...metadata,
    images: metadata.images.map((image) => ({
      ...image,
      src: resolveAgainstBase(image.src, baseUrl),
    })),
    links: metadata.links.map((link) => ({
      ...link,
      href: resolveAgainstBase(link.href, baseUrl),
    })),
    iframes: metadata.iframes.map((frame) => ({
      ...frame,
      src: frame.src ? resolveAgainstBase(frame.src, baseUrl) : "",
    })),
    scripts: metadata.scripts.map((script) => ({
      ...script,
      src: resolveAgainstBase(script.src, baseUrl),
    })),
  };
}

function relativeOutputPath(absolutePath: string): string {
  return path.relative(OUTPUT_DIR, absolutePath).split(path.sep).join("/");
}

async function resetOutputDir(): Promise<void> {
  const resolvedOutput = path.resolve(OUTPUT_DIR);
  const expectedOutput = path.resolve(TOOL_DIR, "output");

  if (resolvedOutput !== expectedOutput) {
    throw new Error(`Refusing to reset unexpected output directory: ${resolvedOutput}`);
  }

  try {
    await fs.rm(resolvedOutput, { recursive: true, force: true });
    console.log("[site-audit] Cleared previous output directory.");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : "";
    if (code !== "ENOENT") {
      throw error;
    }
  }
}

async function ensureOutputDirs(): Promise<void> {
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, "screenshots", "desktop"),
    path.join(OUTPUT_DIR, "screenshots", "mobile"),
    path.join(OUTPUT_DIR, "html"),
    path.join(OUTPUT_DIR, "text"),
    path.join(OUTPUT_DIR, "json"),
  ];
  await Promise.all(dirs.map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function readTargetUrls(): Promise<string[]> {
  const raw = await fs.readFile(URLS_FILE, "utf8");
  const urls = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const unique = [...new Set(urls)];
  if (unique.length === 0) {
    throw new Error(
      `No URLs found in ${URLS_FILE}. Add one URL per line (comments start with #).`,
    );
  }

  for (const url of unique) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(`Unsupported protocol: ${url}`);
      }
    } catch {
      throw new Error(`Invalid URL in urls.txt: ${url}`);
    }
  }

  return unique;
}

async function captureMobileScreenshot(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  url: string,
  slug: string,
): Promise<string> {
  const mobileScreenshotPath = path.join(
    OUTPUT_DIR,
    "screenshots",
    "mobile",
    `${slug}.png`,
  );

  const mobileDevice = getMobileDeviceOptions();
  let mobileContext: BrowserContext | undefined;

  try {
    mobileContext = await browser.newContext({ ...mobileDevice });
    const mobilePage = await mobileContext.newPage();

    console.log(
      `[site-audit] ${slug} (mobile): device=${MOBILE_DEVICE_NAME}, viewport=${mobileDevice.viewport?.width ?? "?"}x${mobileDevice.viewport?.height ?? "?"}, isMobile=${String(mobileDevice.isMobile)}, hasTouch=${String(mobileDevice.hasTouch)}`,
    );

    const mobileResponse = await prepareViewportForCapture(
      mobilePage,
      url,
      `${slug} (mobile)`,
    );

    if (!mobileResponse) {
      throw new Error("Mobile navigation returned no response.");
    }

    if (mobileResponse.status() >= 400) {
      throw new Error(`HTTP ${mobileResponse.status()} on mobile capture for ${url}`);
    }

    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
    return mobileScreenshotPath;
  } finally {
    await mobileContext?.close();
  }
}

async function auditUrl(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  url: string,
): Promise<AuditResult> {
  const slug = urlToSlug(url);

  const page = await browser.newPage();

  try {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    const desktopResponse = await prepareViewportForCapture(
      page,
      url,
      `${slug} (desktop)`,
    );

    if (!desktopResponse) {
      throw new Error("Navigation returned no response.");
    }

    if (desktopResponse.status() >= 400) {
      throw new Error(`HTTP ${desktopResponse.status()} for ${url}`);
    }

    const finalUrl = page.url();
    const html = await page.content();
    const rawText = await page.locator("body").innerText();
    const renderedAssets = await extractRenderedAssets(page, {
      baseUrl: finalUrl,
      viewportType: "desktop",
    });
    const pageMetadata = absolutizeMetadata(extractMetadataFromHtml(html), finalUrl);
    const textSample = normalizeText(rawText).slice(0, 4000);
    const pageType = inferPageType(pageMetadata, textSample);
    const pageRoute = urlToAstroRoute(finalUrl);
    const pathname = getPathname(pageMetadata);

    let renderedEventBlocks: Awaited<ReturnType<typeof extractRenderedEventBlocks>> = [];
    const shouldExtractEventBlocks =
      (pageType === "Home" && (pathname === "/" || pathname === "")) ||
      (pageType === "Schedule Month" && isScheduleMonthPath(pathname));

    if (shouldExtractEventBlocks) {
      renderedEventBlocks = await extractRenderedEventBlocks(page, {
        pageUrl: finalUrl,
        pageRoute,
        pageType,
      });
    }
    const serviceDetection = detectServices({ html, pageMetadata });

    const desktopScreenshotPath = path.join(
      OUTPUT_DIR,
      "screenshots",
      "desktop",
      `${slug}.png`,
    );
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });

    const mobileScreenshotPath = await captureMobileScreenshot(browser, url, slug);

    const metadata: AuditMetadata = {
      url,
      finalUrl,
      capturedAt: new Date().toISOString(),
      possibleEmbeds: serviceDetection.possibleEmbeds,
      detectedEmbeds: serviceDetection.detectedEmbeds,
      detectedExternalLinks: serviceDetection.detectedExternalLinks,
      ...pageMetadata,
      renderedAssets,
      renderedEventBlocks,
    };

    const htmlPath = path.join(OUTPUT_DIR, "html", `${slug}.html`);
    const textPath = path.join(OUTPUT_DIR, "text", `${slug}.txt`);
    const jsonPath = path.join(OUTPUT_DIR, "json", `${slug}.json`);

    await fs.writeFile(htmlPath, html, "utf8");
    await fs.writeFile(textPath, normalizeText(rawText), "utf8");
    await fs.writeFile(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    return {
      ok: true,
      url,
      slug,
      metadata,
      paths: {
        desktopScreenshot: relativeOutputPath(desktopScreenshotPath),
        mobileScreenshot: relativeOutputPath(mobileScreenshotPath),
        html: relativeOutputPath(htmlPath),
        text: relativeOutputPath(textPath),
        json: relativeOutputPath(jsonPath),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, url, slug, error: message };
  } finally {
    await page.close();
  }
}

function formatList(items: string[]): string {
  if (items.length === 0) return "_None_";
  return items.map((item) => `- ${item}`).join("\n");
}

async function writeReport(results: AuditResult[], capturedAt: string): Promise<void> {
  const successes = results.filter((result): result is AuditSuccess => result.ok);
  const failures = results.filter((result): result is AuditFailure => !result.ok);

  const lines: string[] = [
    "# Site Audit Report",
    "",
    `- Captured at: ${capturedAt}`,
    `- Total pages: ${results.length}`,
    `- Successful: ${successes.length}`,
    `- Failed: ${failures.length}`,
    "",
  ];

  for (const result of results) {
    lines.push(`## ${result.url}`, "");

    if (!result.ok) {
      lines.push("- Status: **Failed**");
      lines.push(`- Error: ${result.error}`);
      lines.push("");
      continue;
    }

    const { metadata, paths } = result;
    lines.push(`- Title: ${metadata.title || "_Empty_"}`);
    lines.push(
      `- Meta description: ${metadata.metaDescription?.trim() || "_None_"}`,
    );
    lines.push(
      `- H1: ${metadata.h1.length > 0 ? metadata.h1.join(" | ") : "_None_"}`,
    );
    lines.push("- H2 list:");
    lines.push(formatList(metadata.h2));
    lines.push(`- Screenshot paths:`);
    lines.push(`  - Desktop: \`${paths.desktopScreenshot}\``);
    lines.push(`  - Mobile: \`${paths.mobileScreenshot}\``);
    lines.push(`- Text path: \`${paths.text}\``);
    lines.push(`- HTML path: \`${paths.html}\``);
    lines.push(`- JSON path: \`${paths.json}\``);
    lines.push(`- Images count: ${metadata.images.length}`);
    lines.push(`- Rendered assets count: ${metadata.renderedAssets?.length ?? 0}`);
    lines.push(`- Links count: ${metadata.links.length}`);
    lines.push(`- Iframes count: ${metadata.iframes.length}`);
    lines.push(
      `- Detected embedded widgets: ${
        metadata.detectedEmbeds.length > 0
          ? metadata.detectedEmbeds.join(", ")
          : "_None_"
      }`,
    );
    lines.push(
      `- Detected external service links: ${
        metadata.detectedExternalLinks.length > 0
          ? metadata.detectedExternalLinks.join(", ")
          : "_None_"
      }`,
    );
    lines.push(
      `- Possible embeds (combined): ${
        metadata.possibleEmbeds.length > 0
          ? metadata.possibleEmbeds.join(", ")
          : "_None_"
      }`,
    );
    lines.push(
      "- Notes: Public page capture only. Verify rights/robots before reuse.",
    );
    lines.push("");
  }

  const reportPath = path.join(OUTPUT_DIR, "report.md");
  await fs.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main(): Promise<void> {
  console.log("[site-audit] Reading URLs...");
  const urls = await readTargetUrls();
  await resetOutputDir();
  await ensureOutputDirs();

  const capturedAt = new Date().toISOString();
  const results: AuditResult[] = [];

  console.log(`[site-audit] Auditing ${urls.length} page(s)...`);

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [index, url] of urls.entries()) {
      const label = `[${index + 1}/${urls.length}]`;
      console.log(`${label} ${url}`);
      const result = await auditUrl(browser, url);
      results.push(result);

      if (result.ok) {
        console.log(`${label} OK → ${result.slug}`);
      } else {
        console.error(`${label} FAILED → ${result.error}`);
      }
    }
  } finally {
    await browser.close();
  }

  await writeReport(results, capturedAt);
  await writeMigrationBrief(results, capturedAt);
  await writeImplementationBrief(results);
  await writeRebuildPrompt(results);
  const assetMap = await writeAssetMap(results, capturedAt);
  summarizeAssetMap(assetMap);

  const failed = results.filter((result) => !result.ok).length;
  console.log(`[site-audit] Done. Report: ${path.join(OUTPUT_DIR, "report.md")}`);
  console.log(`[site-audit] Migration brief: ${path.join(OUTPUT_DIR, "migration-brief.md")}`);
  console.log(
    `[site-audit] Implementation brief: ${path.join(OUTPUT_DIR, "implementation-brief.md")}`,
  );
  console.log(`[site-audit] Rebuild prompt: ${path.join(OUTPUT_DIR, "rebuild-prompt.md")}`);
  console.log(`[site-audit] Asset map: ${path.join(OUTPUT_DIR, "asset-map.md")}`);

  if (failed > 0) {
    console.error(`[site-audit] ${failed} URL(s) failed. See report.md for details.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[site-audit] Fatal error:", error);
  process.exit(1);
});
