/**
 * Capture desktop/mobile screenshots of a built static prototype.
 * Run: npm run capture:prototype
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DESKTOP_VIEWPORT,
  getMobileDeviceOptions,
  MOBILE_DEVICE_NAME,
} from "./audit-config.ts";
import { prepareViewportForCapture } from "./page-prepare.ts";
import {
  loadPrototypeCaptureConfig,
  pageUrl,
  screenshotFileName,
  screenshotRelativePath,
} from "./prototype-capture-config.ts";
import {
  closeServer,
  startPrototypeStaticServer,
} from "./prototype-static-server.ts";

type CaptureResult = {
  fileName: string;
  slug: string;
  desktopPath: string | null;
  mobilePath: string | null;
  desktopRelative: string | null;
  mobileRelative: string | null;
  status: "OK" | "Failed";
  error?: string;
};

async function ensureDirs(...dirs: string[]): Promise<void> {
  await Promise.all(dirs.map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyPrototypePages(
  prototypeDir: string,
  pages: { fileName: string }[],
): Promise<void> {
  for (const page of pages) {
    const fullPath = path.join(prototypeDir, page.fileName);
    if (!(await fileExists(fullPath))) {
      throw new Error(`Prototype page not found: ${fullPath}`);
    }
  }
}

function buildReport(
  config: ReturnType<typeof loadPrototypeCaptureConfig>,
  capturedAt: string,
  results: CaptureResult[],
): string {
  const successCount = results.filter((r) => r.status === "OK").length;
  const failedCount = results.length - successCount;

  const lines: string[] = [
    "# Prototype Capture Report",
    "",
    `- Captured at: ${capturedAt}`,
    `- Prototype name: ${config.prototypeName}`,
    `- Prototype directory: ${path.relative(process.cwd(), config.prototypeDir).split(path.sep).join("/")}`,
    `- Pages captured: ${results.length}`,
    `- Successful: ${successCount}`,
    `- Failed: ${failedCount}`,
    "",
    "## Captured Pages",
    "",
    "| Page | Desktop screenshot | Mobile screenshot | Status |",
    "|---|---|---|---|",
  ];

  for (const result of results) {
    const desktopCell = result.desktopRelative
      ? result.desktopRelative
      : "—";
    const mobileCell = result.mobileRelative ? result.mobileRelative : "—";
    const note =
      result.status === "OK"
        ? "OK"
        : `Failed: ${(result.error ?? "unknown").replace(/\|/g, "\\|")}`;
    lines.push(
      `| ${result.fileName} | ${desktopCell} | ${mobileCell} | ${note} |`,
    );
  }

  if (failedCount > 0) {
    lines.push("", "## Errors", "");
    for (const result of results) {
      if (result.status === "Failed" && result.error) {
        lines.push(`- **${result.fileName}:** ${result.error}`);
      }
    }
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Screenshots are full-page captures after scroll/lazy-load preparation.",
    "- Desktop viewport: 1440×1200.",
    `- Mobile device: ${MOBILE_DEVICE_NAME} (Playwright device emulation).`,
    "- This command does not delete other files under `tools/site-audit/output/`.",
    "",
  );

  return lines.join("\n");
}

async function captureDesktop(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  url: string,
  outputPath: string,
  label: string,
): Promise<void> {
  const page = await browser.newPage();
  try {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await prepareViewportForCapture(page, url, `${label} (desktop)`);
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await page.close();
  }
}

async function captureMobile(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  url: string,
  outputPath: string,
  label: string,
): Promise<void> {
  const mobileDevice = getMobileDeviceOptions();
  const context = await browser.newContext({ ...mobileDevice });
  try {
    const page = await context.newPage();
    console.log(
      `[prototype-capture] ${label} (mobile): device=${MOBILE_DEVICE_NAME}, viewport=${mobileDevice.viewport?.width ?? "?"}x${mobileDevice.viewport?.height ?? "?"}`,
    );
    await prepareViewportForCapture(page, url, `${label} (mobile)`);
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  const config = loadPrototypeCaptureConfig();
  const capturedAt = new Date().toISOString();

  console.log("[prototype-capture] Starting prototype screenshot capture...");
  console.log(`[prototype-capture] Prototype: ${config.prototypeName}`);
  console.log(`[prototype-capture] Directory: ${config.prototypeDir}`);

  await verifyPrototypePages(config.prototypeDir, config.pages);
  await ensureDirs(config.outputDir, config.desktopDir, config.mobileDir);

  const server = await startPrototypeStaticServer(
    config.prototypeDir,
    config.host,
    config.port,
  );

  const browser = await chromium.launch();
  const results: CaptureResult[] = [];

  try {
    for (const pageEntry of config.pages) {
      const url = pageUrl(config.host, config.port, pageEntry.fileName);
      const desktopPath = path.join(
        config.desktopDir,
        screenshotFileName(config.prototypeName, pageEntry.slug),
      );
      const mobilePath = path.join(
        config.mobileDir,
        screenshotFileName(config.prototypeName, pageEntry.slug),
      );
      const desktopRelative = screenshotRelativePath(
        "desktop",
        config.prototypeName,
        pageEntry.slug,
      );
      const mobileRelative = screenshotRelativePath(
        "mobile",
        config.prototypeName,
        pageEntry.slug,
      );

      const result: CaptureResult = {
        fileName: pageEntry.fileName,
        slug: pageEntry.slug,
        desktopPath: null,
        mobilePath: null,
        desktopRelative: null,
        mobileRelative: null,
        status: "OK",
      };

      try {
        console.log(`[prototype-capture] ${pageEntry.fileName} ...`);
        await captureDesktop(browser, url, desktopPath, pageEntry.slug);
        result.desktopPath = desktopPath;
        result.desktopRelative = desktopRelative;

        await captureMobile(browser, url, mobilePath, pageEntry.slug);
        result.mobilePath = mobilePath;
        result.mobileRelative = mobileRelative;

        console.log(`[prototype-capture] OK → ${pageEntry.slug}`);
      } catch (error) {
        result.status = "Failed";
        result.error = error instanceof Error ? error.message : String(error);
        console.error(
          `[prototype-capture] Failed ${pageEntry.fileName}: ${result.error}`,
        );
      }

      results.push(result);
    }
  } finally {
    await browser.close();
    await closeServer(server);
    console.log("[prototype-capture] Static server stopped.");
  }

  const report = buildReport(config, capturedAt, results);
  await fs.writeFile(config.reportPath, `${report}\n`, "utf8");

  const ok = results.filter((r) => r.status === "OK").length;
  console.log(
    `[prototype-capture] Done. ${ok}/${results.length} page(s) captured.`,
  );
  console.log(`[prototype-capture] Report: ${config.reportPath}`);
  console.log(`[prototype-capture] Screenshots: ${config.screenshotsDir}`);

  if (ok < results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[prototype-capture] Fatal error:", error);
  process.exit(1);
});
