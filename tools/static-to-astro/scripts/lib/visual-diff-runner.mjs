import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import {
  resolveCompareRoutes,
  routeToDistPath,
  routeToSlug,
  routeToSourceHtmlFile,
} from "./route-map.mjs";
import { writeVisualDiffAnalysisFromResults } from "./visual-diff-analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");

export const VIEWPORTS = {
  desktop: { width: 1440, height: 1200, label: "desktop" },
  mobile: { width: 390, height: 1200, label: "mobile" },
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  stream.pipe(res);
  stream.on("error", () => {
    res.writeHead(500);
    res.end();
  });
}

/**
 * Flat HTML uses relative `css/`, `images/` paths. When served at `/about/`, the browser
 * resolves them under `/about/css/` and styles fail. Rewrite to site-root paths for fair diff.
 * @param {string} html
 */
export function rewriteSourceHtmlForRootServe(html) {
  return html
    .replace(/\bhref="(?!https?:|\/|#|mailto:|tel:|javascript:)([^"]+)"/gi, (_, ref) => {
      const normalized = ref.replace(/^\//, "");
      return `href="/${normalized}"`;
    })
    .replace(/\bsrc="(?!https?:|\/|data:)([^"]+)"/gi, (_, ref) => {
      const normalized = ref.replace(/^\//, "");
      return `src="/${normalized}"`;
    });
}

function sendHtml(res, filePath) {
  const html = rewriteSourceHtmlForRootServe(fs.readFileSync(filePath, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

/**
 * Flat static HTML (gosaki): /about/ → about.html
 */
export function createSourceStaticServer(sourceDir) {
  return http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, "http://local").pathname);
    if (pathname.includes("..")) {
      res.writeHead(400);
      res.end();
      return;
    }

    const directAsset = path.join(sourceDir, pathname.replace(/^\//, ""));
    if (pathname !== "/" && fs.existsSync(directAsset) && fs.statSync(directAsset).isFile()) {
      return sendFile(res, directAsset);
    }

    if (!pathname.endsWith("/")) {
      pathname = `${pathname}/`;
    }

    const htmlFile = routeToSourceHtmlFile(pathname);
    if (!htmlFile) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`No source HTML for ${pathname}`);
      return;
    }

    const abs = path.join(sourceDir, htmlFile);
    if (!fs.existsSync(abs)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Missing ${htmlFile}`);
      return;
    }
    sendHtml(res, abs);
  });
}

/**
 * Astro dist/: /about/ → dist/about/index.html
 */
export function createDistStaticServer(distDir) {
  return http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, "http://local").pathname);
    if (pathname.includes("..")) {
      res.writeHead(400);
      res.end();
      return;
    }

    const direct = path.join(distDir, pathname.replace(/^\//, ""));
    if (pathname !== "/" && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
      return sendFile(res, direct);
    }

    const route = pathname.endsWith("/") ? pathname || "/" : `${pathname}/`;
    const htmlPath = path.join(distDir, routeToDistPath(route));
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
      return sendFile(res, htmlPath);
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve(`http://127.0.0.1:${addr.port}`);
    });
    server.on("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

/**
 * @param {string} astroDir
 */
export async function ensureAstroDist(astroDir) {
  const distDir = path.join(astroDir, "dist");
  if (fs.existsSync(distDir) && fs.existsSync(path.join(distDir, "index.html"))) {
    return distDir;
  }

  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: astroDir,
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    let out = "";
    child.stdout?.on("data", (d) => {
      out += d;
    });
    child.stderr?.on("data", (d) => {
      out += d;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`npm run build failed (exit ${code})\n${out.slice(-2000)}`));
        return;
      }
      resolve(distDir);
    });
  });
}

/**
 * @param {string} pngPath
 */
function readPng(pngPath) {
  return PNG.sync.read(fs.readFileSync(pngPath));
}

/**
 * @param {string} aPath
 * @param {string} bPath
 * @param {string} outPath
 */
export function writeDiffImage(aPath, bPath, outPath) {
  const imgA = readPng(aPath);
  const imgB = readPng(bPath);

  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return {
      ok: false,
      reason: `size mismatch: ${imgA.width}x${imgA.height} vs ${imgB.width}x${imgB.height}`,
      mismatchPixels: null,
    };
  }

  const { width, height } = imgA;
  const diff = new PNG({ width, height });
  const mismatchPixels = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(diff));

  return {
    ok: true,
    reason: null,
    mismatchPixels,
    totalPixels: width * height,
  };
}

/**
 * @param {object} options
 */
export async function runVisualDiff({
  sourceDir,
  astroDir,
  outDir,
  routes = [],
  generateDiff = true,
  intentionalDiffsPath = null,
}) {
  const sourceAbs = path.resolve(sourceDir);
  const astroAbs = path.resolve(astroDir);
  const outAbs = path.resolve(outDir);
  const compareRoutes = resolveCompareRoutes(sourceAbs, routes);
  const startedAt = new Date().toISOString();

  fs.mkdirSync(path.join(outAbs, "source"), { recursive: true });
  fs.mkdirSync(path.join(outAbs, "astro"), { recursive: true });
  if (generateDiff) fs.mkdirSync(path.join(outAbs, "diff"), { recursive: true });

  const distDir = await ensureAstroDist(astroAbs);
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error(`Astro dist not found at ${distDir}. Run convert with --verify-build first.`);
  }

  const sourceServer = createSourceStaticServer(sourceAbs);
  const astroServer = createDistStaticServer(distDir);
  const sourceBase = await listen(sourceServer);
  const astroBase = await listen(astroServer);

  const results = [];
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    for (const route of compareRoutes) {
      const slug = routeToSlug(route);
      const sourceHtml = routeToSourceHtmlFile(route);
      const sourceAvailable = sourceHtml && fs.existsSync(path.join(sourceAbs, sourceHtml));
      const astroRel = routeToDistPath(route);
      const astroAvailable = fs.existsSync(path.join(distDir, astroRel));

      const row = {
        route,
        slug,
        sourceAvailable,
        astroAvailable,
        viewports: [],
        status: "ok",
        notes: [],
      };

      if (!astroAvailable) {
        row.status = "error";
        row.notes.push(`Astro dist missing: ${astroRel}`);
        results.push(row);
        continue;
      }

      if (!sourceAvailable) {
        row.notes.push("No source HTML (astro-only route, e.g. /schedule/ index)");
      }

      for (const vp of Object.values(VIEWPORTS)) {
        const vpResult = {
          viewport: vp.label,
          sourceScreenshot: null,
          astroScreenshot: null,
          diffScreenshot: null,
          mismatchPixels: null,
          mismatchPercent: null,
          status: "ok",
          error: null,
        };

        try {
          if (sourceAvailable) {
            const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
            const res = await page.goto(`${sourceBase}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
            if (!res || !res.ok()) {
              throw new Error(`source HTTP ${res?.status() ?? "failed"} for ${route}`);
            }
            const outPath = path.join(outAbs, "source", `${slug}.${vp.label}.png`);
            await page.screenshot({ path: outPath, fullPage: false });
            vpResult.sourceScreenshot = path.relative(outAbs, outPath);
            await page.close();
          }

          {
            const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
            const res = await page.goto(`${astroBase}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
            if (!res || !res.ok()) {
              throw new Error(`astro HTTP ${res?.status() ?? "failed"} for ${route}`);
            }
            const outPath = path.join(outAbs, "astro", `${slug}.${vp.label}.png`);
            await page.screenshot({ path: outPath, fullPage: false });
            vpResult.astroScreenshot = path.relative(outAbs, outPath);
            await page.close();
          }

          if (generateDiff && sourceAvailable && vpResult.sourceScreenshot && vpResult.astroScreenshot) {
            const diffPath = path.join(outAbs, "diff", `${slug}.${vp.label}.png`);
            const diff = writeDiffImage(
              path.join(outAbs, vpResult.sourceScreenshot),
              path.join(outAbs, vpResult.astroScreenshot),
              diffPath,
            );
            if (diff.ok) {
              vpResult.diffScreenshot = path.relative(outAbs, diffPath);
              vpResult.mismatchPixels = diff.mismatchPixels;
              vpResult.mismatchPercent =
                diff.totalPixels > 0
                  ? ((diff.mismatchPixels / diff.totalPixels) * 100).toFixed(2)
                  : "0.00";
            } else {
              vpResult.status = "diff-skipped";
              vpResult.error = diff.reason;
              row.notes.push(`${vp.label}: ${diff.reason}`);
            }
          } else if (!sourceAvailable) {
            vpResult.status = "astro-only";
          }
        } catch (err) {
          vpResult.status = "error";
          vpResult.error = err.message;
          row.status = "error";
        }

        row.viewports.push(vpResult);
      }

      results.push(row);
    }
  } finally {
    await browser.close();
    await closeServer(sourceServer);
    await closeServer(astroServer);
  }

  const diffGenerated = generateDiff && results.some((r) =>
    r.viewports.some((v) => v.diffScreenshot),
  );

  const reportPath = path.join(outAbs, "VISUAL_DIFF_REPORT.md");
  const report = formatVisualDiffReport({
    sourceDir: sourceAbs,
    astroDir: astroAbs,
    distDir,
    outDir: outAbs,
    startedAt,
    compareRoutes,
    results,
    diffGenerated,
    sourceBase,
    astroBase,
  });
  fs.writeFileSync(reportPath, report, "utf8");

  appendVisualDiffToConversionReport(astroAbs, {
    outDir: outAbs,
    reportPath,
    results,
    diffGenerated,
    startedAt,
  });

  const analysis = writeVisualDiffAnalysisFromResults({
    outDir: outAbs,
    astroDir: astroAbs,
    results,
    executedAt: startedAt,
    compareRoutes,
    intentionalDiffsPath,
  });

  return {
    outDir: outAbs,
    reportPath,
    analysisPath: analysis.analysisPath,
    analysisCounts: analysis.counts,
    intentionalSummary: analysis.intentionalSummary,
    results,
    diffGenerated,
  };
}

function formatVisualDiffReport({
  sourceDir,
  astroDir,
  distDir,
  outDir,
  startedAt,
  compareRoutes,
  results,
  diffGenerated,
  sourceBase,
  astroBase,
}) {
  const errorRoutes = results.filter((r) => r.status === "error");
  const lines = [
    "# Visual Diff Report",
    "",
    "Generated by static-to-astro visual-diff (Phase 2-G).",
    "",
    "## Summary",
    "",
    `- **Source directory:** \`${sourceDir}\``,
    `- **Astro project:** \`${astroDir}\``,
    `- **Astro dist served from:** \`${distDir}\``,
    `- **Output directory:** \`${outDir}\``,
    `- **Executed at:** ${startedAt}`,
    `- **Source server (ephemeral):** ${sourceBase}`,
    `- **Astro server (ephemeral):** ${astroBase}`,
    `- **Routes compared:** ${compareRoutes.length}`,
    `- **Viewports:** desktop 1440×1200, mobile 390×1200`,
    `- **Diff images:** ${diffGenerated ? "yes (`diff/`)" : "no"}`,
    `- **Routes with errors:** ${errorRoutes.length}`,
    "",
    "## Compared routes",
    "",
    compareRoutes.map((r) => `- \`${r}\``).join("\n"),
    "",
    "## Per-route results",
    "",
    "| Route | Status | Source | Astro | Notes |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const row of results) {
    const notes = row.notes.join("; ") || "—";
    lines.push(
      `| \`${row.route}\` | ${row.status} | ${row.sourceAvailable ? "yes" : "no"} | ${row.astroAvailable ? "yes" : "no"} | ${notes} |`,
    );
  }
  lines.push("");

  for (const row of results) {
    lines.push(`### ${row.route}`, "");
    for (const vp of row.viewports) {
      lines.push(`#### ${vp.viewport}`, "");
      lines.push(`- **status:** ${vp.status}`);
      if (vp.sourceScreenshot) lines.push(`- **source:** \`${vp.sourceScreenshot}\``);
      if (vp.astroScreenshot) lines.push(`- **astro:** \`${vp.astroScreenshot}\``);
      if (vp.diffScreenshot) {
        lines.push(`- **diff:** \`${vp.diffScreenshot}\``);
        lines.push(`- **mismatch:** ${vp.mismatchPixels} px (${vp.mismatchPercent}%)`);
      }
      if (vp.error) lines.push(`- **error:** ${vp.error}`);
      lines.push("");
    }
  }

  lines.push(
    "## Manual review",
    "",
    "- Diff % is informational only — no automatic pass/fail in Phase 2-G.",
    "- Review schedule cards, images, and fonts — missing assets may not appear in static HTML.",
    "- `/schedule/` may exist only on Astro; source has no index for that hub.",
    "- Compare in the same environment (local fonts, network for external CSS).",
    "- Re-run after asset or CSS fixes.",
    "",
  );

  return lines.join("\n");
}

/**
 * @param {string} astroDir
 */
function appendVisualDiffToConversionReport(astroDir, { outDir, reportPath, results, diffGenerated, startedAt }) {
  const conversionPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const relReport = path.relative(astroDir, reportPath);
  const errors = results.filter((r) => r.status === "error");
  const block = [
    "",
    "## Visual diff (Phase 2-G)",
    "",
    `- **Executed at:** ${startedAt}`,
    `- **Detail report:** \`${relReport}\` (also: \`${outDir}\`)`,
    `- **Routes captured:** ${results.length}`,
    `- **Diff images generated:** ${diffGenerated ? "yes" : "no"}`,
    `- **Errors:** ${errors.length}${errors.length ? ` — ${errors.map((e) => e.route).join(", ")}` : ""}`,
    "- **Note:** Mismatch % is not a deploy gate; manual review required.",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Visual diff (Phase 2-G)";
  if (content.includes(marker)) {
    const before = content.split(marker)[0].trimEnd();
    content = `${before}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}
