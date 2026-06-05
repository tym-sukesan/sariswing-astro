import fs from "node:fs";
import path from "node:path";
import {
  applyIntentionalDiffAdjustments,
  loadIntentionalDiffs,
  summarizeIntentionalCounts,
} from "./intentional-diffs.mjs";

/** @typedef {'High' | 'Medium' | 'Low'} Priority */

export const CAUSE_CATEGORIES = {
  A: "画像欠損・画像サイズ差",
  B: "フォント差・外部フォント読み込み差",
  C: "Header / nav 構造差",
  D: "main / section / wrapper 構造差",
  E: "レスポンシブCSS差",
  F: "JS未移植・インラインscript未移植",
  G: "フォーム・iframeなど外部要素差",
  H: "Astro化で意図的に改善した差分",
};

const HIGH_THRESHOLD = 25;
const MEDIUM_THRESHOLD = 10;
const MOBILE_HIGH_THRESHOLD = 35;

/**
 * @param {string} conversionReportPath
 */
export function parseConversionHints(conversionReportPath) {
  const hints = {
    missingAssets: 0,
    forms: 0,
    iframes: 0,
    externalJs: 0,
    inlineScripts: 0,
    scheduleHub: false,
    headerMonthlyExcluded: false,
    mainWrapper: true,
    raw: "",
  };

  if (!conversionReportPath || !fs.existsSync(conversionReportPath)) {
    return hints;
  }

  const raw = fs.readFileSync(conversionReportPath, "utf8");
  hints.raw = raw;

  const pick = (re) => {
    const m = raw.match(re);
    return m ? Number(m[1]) || 0 : 0;
  };

  hints.missingAssets = pick(/\*\*欠損アセット:\*\* (\d+)/);
  hints.forms = pick(/\*\*フォーム:\*\* (\d+)/);
  hints.iframes = pick(/\*\*iframe:\*\* (\d+)/);
  hints.externalJs = pick(/\*\*外部 JS:\*\* (\d+)/);
  hints.inlineScripts = pick(/\*\*インライン script:\*\* (\d+)/);
  hints.scheduleHub = /Schedule 一覧/.test(raw) || /schedule\/index\.astro/.test(raw);
  hints.headerMonthlyExcluded = /Header 月別リンク除外:\*\* yes/.test(raw);
  hints.mainWrapper = /BaseLayout `<main><slot/.test(raw);

  return hints;
}

/**
 * Parse VISUAL_DIFF_REPORT.md into structured rows.
 * @param {string} reportPath
 */
export function parseVisualDiffReport(reportPath) {
  const content = fs.readFileSync(reportPath, "utf8");
  const executedAt = content.match(/\*\*Executed at:\*\* (.+)/)?.[1]?.trim() ?? "—";
  const compareRoutes = [...content.matchAll(/^- `([^`]+)`$/gm)]
    .map((m) => m[1])
    .filter((r) => r.startsWith("/"));

  const entries = [];
  const blocks = content.split(/^### /m).slice(1);

  for (const block of blocks) {
    const route = block.split("\n")[0].trim();
    if (!route.startsWith("/")) continue;

    for (const vp of ["desktop", "mobile"]) {
      const vpSection = block.match(new RegExp(`#### ${vp}\\s+([\\s\\S]*?)(?=#### |$)`));
      if (!vpSection) continue;

      const section = vpSection[1];
      const status = section.match(/\*\*status:\*\* (\S+)/)?.[1] ?? "ok";
      const source = section.match(/\*\*source:\*\* `([^`]+)`/)?.[1] ?? null;
      const astro = section.match(/\*\*astro:\*\* `([^`]+)`/)?.[1] ?? null;
      const diff = section.match(/\*\*diff:\*\* `([^`]+)`/)?.[1] ?? null;
      const mismatchMatch = section.match(/\*\*mismatch:\*\* [\d,]+ px \(([\d.]+)%\)/);
      const mismatchPercent = mismatchMatch ? Number(mismatchMatch[1]) : null;
      const error = section.match(/\*\*error:\*\* (.+)/)?.[1] ?? null;

      entries.push({
        route,
        viewport: vp,
        status,
        sourceScreenshot: source,
        astroScreenshot: astro,
        diffScreenshot: diff,
        mismatchPercent,
        error,
        astroOnly: status === "astro-only",
      });
    }
  }

  return { executedAt, compareRoutes, entries };
}

/**
 * @param {object} row
 * @param {ReturnType<typeof parseConversionHints>} hints
 */
export function inferCauseCandidates(row, hints) {
  const codes = [];
  const { route, viewport, mismatchPercent, astroOnly } = row;

  if (astroOnly || route === "/schedule/") {
    codes.push("H");
    return { codes, note: "Schedule一覧はAstro新設（ソースHTMLなし）" };
  }

  if (hints.missingAssets > 0) codes.push("A");
  if (hints.forms > 0 && /contact/i.test(route)) codes.push("G");
  if (hints.iframes > 0 && /contact/i.test(route)) codes.push("G");
  if (hints.externalJs > 0) codes.push("F");
  if (hints.inlineScripts > 0) codes.push("F");
  if (hints.headerMonthlyExcluded && (route === "/" || mismatchPercent > 15)) codes.push("C");
  if (!hints.mainWrapper) codes.push("D");

  if (/about/i.test(route)) {
    codes.push("A", "D");
  }
  if (/schedule-2026/.test(route)) {
    codes.push("A");
  }
  if (viewport === "mobile" && mismatchPercent != null && mismatchPercent >= 20) {
    codes.push("E", "B");
  }
  if (viewport === "desktop" && mismatchPercent != null && mismatchPercent >= 15) {
    codes.push("D");
  }
  if (mismatchPercent != null && mismatchPercent < 5) {
    return { codes: [...new Set(codes)], note: "ピクセル差分は小さい — 許容範囲の可能性" };
  }

  const unique = [...new Set(codes)];
  if (!unique.length) {
    unique.push("B", "E");
  }

  return {
    codes: unique,
    note: "自動推定 — 目視で source / astro / diff を確認してください",
  };
}

/**
 * @param {object} row
 */
export function assignPriority(row) {
  if (row.status === "error") return "High";
  if (row.astroOnly) return "Low";

  const p = row.mismatchPercent;
  if (p == null) return "Medium";

  if (p < MEDIUM_THRESHOLD) return "Low";
  if (p >= HIGH_THRESHOLD) return "High";
  if (row.viewport === "mobile" && p >= MOBILE_HIGH_THRESHOLD) return "High";
  if (p >= MEDIUM_THRESHOLD) return "Medium";
  return "Low";
}

/**
 * @param {Array<object>} entries
 */
export function analyzeVisualDiffEntries(entries, hints, intentionalConfig = null) {
  const base = entries.map((entry) => {
    const priority = assignPriority(entry);
    const { codes, note } = inferCauseCandidates(entry, hints);
    const causeLabels = codes.map((c) => `${c}. ${CAUSE_CATEGORIES[c]}`);

    return {
      ...entry,
      priority,
      causeCodes: codes,
      causeLabels,
      causeNote: note,
    };
  });

  return intentionalConfig ? applyIntentionalDiffAdjustments(base, intentionalConfig) : base;
}

function linkOrDash(rel) {
  return rel ? `./${rel.replace(/\\/g, "/")}` : "—";
}

/**
 * @param {object} params
 */
function formatIntentionalDiffSection(analyzed, intentionalConfig, intentionalSummary) {
  if (!intentionalConfig) return [];

  const matched = analyzed.filter((a) => a.intentionalDiffId);
  const lines = [
    "## Intentional differences",
    "",
    `- **Config file:** \`${intentionalConfig.configPath}\``,
    `- **Site:** ${intentionalConfig.siteName}`,
    `- **Rules defined:** ${intentionalConfig.intentionalDiffs.length}`,
    `- **Entries matched:** ${matched.length}`,
    `- **Excluded from High count:** ${intentionalSummary.excludedFromHigh}`,
    `- **True High remaining:** ${intentionalSummary.trueHigh}`,
    "",
    "### Intentional diff rules",
    "",
    "| id | route / pattern | viewport | category | reason |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const rule of intentionalConfig.intentionalDiffs) {
    const target = rule.route ?? rule.routePattern ?? "—";
    lines.push(
      `| ${rule.id} | ${target} | ${rule.viewport} | ${rule.category} | ${rule.reason} |`,
    );
  }
  lines.push("");

  lines.push(
    "### Adjusted priorities (High → Known intentional difference)",
    "",
    "| Route | Viewport | Mismatch | Original priority | Adjusted priority | Intentional diff id | Reason |",
    "| --- | --- | ---:| --- | --- | --- | --- |",
  );

  for (const a of matched) {
    const mismatch = a.astroOnly ? "astro-only" : a.mismatchPercent != null ? `${a.mismatchPercent.toFixed(2)}%` : "—";
    lines.push(
      `| \`${a.route}\` | ${a.viewport} | ${mismatch} | ${a.rawPriority ?? a.priority} | ${a.adjustedPriority ?? a.priority} | ${a.intentionalDiffId} | ${a.intentionalReason ?? "—"} |`,
    );
  }
  lines.push("");

  const stillManual = matched.filter(
    (a) => /contact/i.test(a.route) || (a.rawPriority === "High" && a.intentionalDiffId),
  );
  lines.push("### Still manually review (intentional match does not skip eyeball)", "");
  if (stillManual.length) {
    for (const a of stillManual) {
      lines.push(
        `- [ ] \`${a.route}\` ${a.viewport} — ${a.mismatchPercent?.toFixed(2) ?? "astro-only"}% (${a.intentionalDiffId}: nav/layout may hide other regressions)`,
      );
    }
  } else {
    lines.push("_None beyond standard spot-check_", "");
  }
  lines.push("");

  return lines;
}

export function formatVisualDiffAnalysis({
  outDir,
  executedAt,
  compareRoutes,
  analyzed,
  hints,
  reportPath,
  intentionalConfig = null,
  intentionalSummary = null,
}) {
  const summary = intentionalSummary ?? summarizeIntentionalCounts(analyzed);
  const counts = summary.counts;

  const large = analyzed.filter(
    (a) => !a.astroOnly && a.mismatchPercent != null && a.mismatchPercent >= HIGH_THRESHOLD,
  );
  const small = analyzed.filter(
    (a) => !a.astroOnly && a.mismatchPercent != null && a.mismatchPercent < MEDIUM_THRESHOLD,
  );
  const astroOnly = analyzed.filter((a) => a.astroOnly);
  const errors = analyzed.filter((a) => a.status === "error" || a.error);
  const trueHigh = analyzed.filter((a) => a.rawPriority === "High" && !a.intentionalDiffId);
  const manualReview = analyzed.filter(
    (a) => (a.rawPriority === "High" && !a.intentionalDiffId) || a.rawPriority === "Medium",
  );

  const lines = [
    "# Visual Diff Analysis",
    "",
    "Generated by static-to-astro (Phase 2-J).",
    "",
    "## Summary",
    "",
    `- **Based on:** \`${path.basename(reportPath)}\``,
    `- **Output directory:** \`${outDir}\``,
    `- **Executed at (visual diff):** ${executedAt}`,
    `- **Compared routes:** ${compareRoutes.length}`,
    `- **Viewports:** desktop 1440×1200, mobile 390×1200`,
    `- **Priority counts (adjusted):** High ${counts.High ?? 0} / Medium ${counts.Medium ?? 0} / Low ${counts.Low ?? 0} / Known intentional ${counts["Known intentional difference"] ?? 0}`,
    `- **True High (raw High, not intentional):** ${summary.trueHigh}`,
    `- **Excluded from High (now Known intentional):** ${summary.excludedFromHigh}`,
    `- **Large diff (≥${HIGH_THRESHOLD}%):** ${large.length} entry(ies)`,
    `- **Small diff (<${MEDIUM_THRESHOLD}%):** ${small.length} entry(ies)`,
    `- **Astro-only entries:** ${astroOnly.length}`,
    `- **Errors:** ${errors.length}`,
    "",
    ...formatIntentionalDiffSection(analyzed, intentionalConfig, summary),
    "## Mismatch rate overview",
    "",
    "| Route | Viewport | Mismatch | Priority | Raw priority | Intentional id |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  const sorted = [...analyzed].sort((a, b) => (b.mismatchPercent ?? -1) - (a.mismatchPercent ?? -1));
  for (const a of sorted) {
    const mismatch = a.astroOnly ? "astro-only" : a.mismatchPercent != null ? `${a.mismatchPercent.toFixed(2)}%` : "—";
    const id = a.intentionalDiffId ?? "—";
    lines.push(
      `| \`${a.route}\` | ${a.viewport} | ${mismatch} | ${a.priority} | ${a.rawPriority ?? "—"} | ${id} |`,
    );
  }
  lines.push("");

  lines.push(
    "## Screenshot index (with links)",
    "",
    "| Route | Viewport | Source | Astro | Diff | Mismatch | Priority |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );

  for (const a of sorted) {
    const mismatch = a.astroOnly ? "—" : a.mismatchPercent != null ? `${a.mismatchPercent.toFixed(2)}%` : "—";
    const src = a.sourceScreenshot ? `[source](${linkOrDash(a.sourceScreenshot)})` : "—";
    const ast = a.astroScreenshot ? `[astro](${linkOrDash(a.astroScreenshot)})` : "—";
    const dif = a.diffScreenshot ? `[diff](${linkOrDash(a.diffScreenshot)})` : "—";
    lines.push(
      `| \`${a.route}\` | ${a.viewport} | ${src} | ${ast} | ${dif} | ${mismatch} | ${a.priority} |`,
    );
  }
  lines.push("");

  if (large.length) {
    lines.push("## Routes with large diff", "");
    for (const a of large) {
      const tag = a.intentionalDiffId ? `${a.priority} [${a.intentionalDiffId}]` : a.priority;
      lines.push(`- \`${a.route}\` **${a.viewport}** — ${a.mismatchPercent.toFixed(2)}% (${tag})`);
    }
    lines.push("");
  }

  if (trueHigh.length) {
    lines.push("## True High (requires fix investigation)", "");
    for (const a of trueHigh) {
      lines.push(`- \`${a.route}\` **${a.viewport}** — ${a.mismatchPercent?.toFixed(2)}%`);
    }
    lines.push("");
  } else if (intentionalConfig) {
    lines.push("## True High (requires fix investigation)", "", "_None — all former High entries matched intentional diff rules_", "");
  }

  if (small.length) {
    lines.push("## Routes with small diff", "");
    for (const a of small) {
      lines.push(`- \`${a.route}\` **${a.viewport}** — ${a.mismatchPercent.toFixed(2)}% (${a.priority})`);
    }
    lines.push("");
  }

  if (astroOnly.length) {
    lines.push("## Astro-only routes", "");
    for (const a of astroOnly) {
      lines.push(
        `- \`${a.route}\` **${a.viewport}** — ${a.astroScreenshot ? linkOrDash(a.astroScreenshot) : "—"} (${a.priority}: ${a.causeNote})`,
      );
    }
    lines.push("");
  }

  if (errors.length) {
    lines.push("## Routes with errors", "");
    for (const a of errors) {
      lines.push(`- \`${a.route}\` **${a.viewport}** — ${a.error ?? a.status}`);
    }
    lines.push("");
  }

  lines.push("## Cause category reference", "");
  for (const [code, label] of Object.entries(CAUSE_CATEGORIES)) {
    lines.push(`- **${code}.** ${label}`);
  }
  lines.push("");

  lines.push("## Per-route analysis", "");
  for (const a of sorted) {
    lines.push(`### \`${a.route}\` — ${a.viewport}`, "");
    lines.push(`- **Priority:** ${a.priority}${a.rawPriority && a.rawPriority !== a.priority ? ` (raw: ${a.rawPriority})` : ""}`);
    if (a.intentionalDiffId) {
      lines.push(`- **Intentional diff:** ${a.intentionalDiffId} — ${a.intentionalReason}`);
    }
    lines.push(`- **Mismatch:** ${a.astroOnly ? "n/a (astro-only)" : `${a.mismatchPercent?.toFixed(2) ?? "—"}%`}`);
    lines.push(`- **Status:** ${a.status}`);
    if (a.sourceScreenshot) lines.push(`- **Source:** [${a.sourceScreenshot}](${linkOrDash(a.sourceScreenshot)})`);
    if (a.astroScreenshot) lines.push(`- **Astro:** [${a.astroScreenshot}](${linkOrDash(a.astroScreenshot)})`);
    if (a.diffScreenshot) lines.push(`- **Diff:** [${a.diffScreenshot}](${linkOrDash(a.diffScreenshot)})`);
    lines.push(`- **Cause candidates:** ${a.causeLabels.join("; ") || "—"}`);
    lines.push(`- **Note:** ${a.causeNote}`);
    lines.push("");
  }

  if (manualReview.length) {
    lines.push("## Manual review recommended", "");
    for (const a of trueHigh) {
      lines.push(`- [ ] **True High** \`${a.route}\` ${a.viewport} — ${a.mismatchPercent?.toFixed(2) ?? "—"}%`);
    }
    for (const a of manualReview.filter((x) => x.rawPriority === "Medium" && !x.intentionalDiffId)) {
      lines.push(`- [ ] **Medium** \`${a.route}\` ${a.viewport} — ${a.mismatchPercent?.toFixed(2) ?? "—"}%`);
    }
    lines.push("");
  }

  const intentionalSpotCheck = analyzed.filter((a) => a.intentionalDiffId);
  if (intentionalSpotCheck.length) {
    lines.push("## Intentional diff — spot-check anyway", "");
    for (const a of intentionalSpotCheck) {
      lines.push(
        `- [ ] \`${a.route}\` ${a.viewport} — ${a.mismatchPercent?.toFixed(2) ?? "astro-only"}% (${a.intentionalDiffId})`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Conversion context (from CONVERSION_REPORT)",
    "",
    `- Missing assets: ${hints.missingAssets}`,
    `- Forms: ${hints.forms}`,
    `- Iframes: ${hints.iframes}`,
    `- External JS: ${hints.externalJs}`,
    `- Inline scripts: ${hints.inlineScripts}`,
    `- Header monthly links excluded: ${hints.headerMonthlyExcluded ? "yes" : "no"}`,
    `- Main wrapper in BaseLayout: ${hints.mainWrapper ? "yes" : "no"}`,
    "",
    "## Next steps",
    "",
    "1. Review High priority screenshots first.",
    "2. Classify root cause manually using categories A–H.",
    "3. Fix converter or assets in `tools/static-to-astro/` (not production Sariswing).",
    "4. Re-run `convert-static-to-astro.mjs` and `visual-diff.mjs`.",
    "5. Compare mismatch % in a new `VISUAL_DIFF_ANALYSIS.md`.",
    "",
  );

  return {
    content: lines.join("\n"),
    counts,
    large,
    small,
    astroOnly,
    errors,
    manualReview,
    intentionalSummary: summary,
    trueHigh,
  };
}

function preserveTrailingSection(existingContent, marker) {
  if (!existingContent?.includes(marker)) return "";
  return existingContent.slice(existingContent.indexOf(marker));
}

/**
 * @param {object} params
 */
export function writeVisualDiffAnalysis({
  outDir,
  astroDir,
  reportPath = path.join(outDir, "VISUAL_DIFF_REPORT.md"),
  intentionalDiffsPath = null,
}) {
  const outAbs = path.resolve(outDir);
  const astroAbs = astroDir ? path.resolve(astroDir) : null;
  const conversionPath = astroAbs ? path.join(astroAbs, "CONVERSION_REPORT.md") : null;
  const analysisPath = path.join(outAbs, "VISUAL_DIFF_ANALYSIS.md");
  const priorContent = fs.existsSync(analysisPath) ? fs.readFileSync(analysisPath, "utf8") : "";
  const phase2i = preserveTrailingSection(priorContent, "## Phase 2-I:");

  const intentionalConfig = intentionalDiffsPath ? loadIntentionalDiffs(intentionalDiffsPath) : null;

  const { executedAt, compareRoutes, entries } = parseVisualDiffReport(reportPath);
  const hints = parseConversionHints(conversionPath);
  const analyzed = analyzeVisualDiffEntries(entries, hints, intentionalConfig);
  const intentionalSummary = summarizeIntentionalCounts(analyzed);
  const analysis = formatVisualDiffAnalysis({
    outDir: outAbs,
    executedAt,
    compareRoutes,
    analyzed,
    hints,
    reportPath,
    intentionalConfig,
    intentionalSummary,
  });

  let body = analysis.content;
  if (phase2i && !body.includes("## Phase 2-I:")) {
    body = `${body.trimEnd()}\n\n${phase2i}`;
  }
  fs.writeFileSync(analysisPath, body, "utf8");

  if (astroAbs) {
    appendAnalysisToConversionReport(astroAbs, {
      analysisPath,
      outAbs,
      counts: analysis.counts,
      astroOnly: analysis.astroOnly,
      manualReview: analysis.manualReview,
      intentionalSummary,
    });
    appendIntentionalDiffsToConversionReport(astroAbs, {
      intentionalConfig,
      intentionalSummary,
      analysisPath,
      analyzed,
    });
  }

  return {
    analysisPath,
    counts: analysis.counts,
    analyzed,
    large: analysis.large,
    intentionalSummary,
  };
}

/**
 * @param {string} astroDir
 */
function appendAnalysisToConversionReport(
  astroDir,
  { analysisPath, outAbs, counts, astroOnly, manualReview, intentionalSummary },
) {
  const conversionPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const relAnalysis = path.relative(astroDir, analysisPath);
  const trueHighRoutes = manualReview.filter((a) => a.rawPriority === "High" && !a.intentionalDiffId);
  const mediumRoutes = manualReview.filter((a) => a.rawPriority === "Medium" && !a.intentionalDiffId);
  const astroOnlyRoutes = [...new Set(astroOnly.map((a) => a.route))];
  const known = counts["Known intentional difference"] ?? 0;
  const trueHighLine = intentionalSummary
    ? `- **True High:** ${intentionalSummary.trueHigh} | **Known intentional:** ${intentionalSummary.knownIntentional}`
    : "";

  const block = [
    "",
    "## Visual diff analysis (Phase 2-J)",
    "",
    `- **Analysis report:** \`${relAnalysis}\``,
    `- **Output folder:** \`${outAbs}\``,
    `- **Priority (adjusted):** High ${counts.High ?? 0} / Medium ${counts.Medium ?? 0} / Low ${counts.Low ?? 0} / Known intentional ${known}`,
    trueHighLine,
    `- **Astro-only routes:** ${astroOnlyRoutes.length ? astroOnlyRoutes.map((r) => `\`${r}\``).join(", ") : "—"}`,
    `- **Review next (true High):** ${trueHighRoutes.length ? trueHighRoutes.map((a) => `\`${a.route}\` ${a.viewport}`).join(", ") : "—"}`,
    `- **Review next (Medium):** ${mediumRoutes.length ? mediumRoutes.map((a) => `\`${a.route}\` ${a.viewport}`).join(", ") : "—"}`,
    "",
  ].join("\n");

  const marker = "## Visual diff analysis (Phase 2-J)";

  let content = fs.readFileSync(conversionPath, "utf8");
  const legacyMarker = "## Visual diff analysis (Phase 2-H)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else if (content.includes(legacyMarker)) {
    content = `${content.split(legacyMarker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

/**
 * Build analysis directly from visual-diff runner results (no parse).
 */
function appendIntentionalDiffsToConversionReport(
  astroDir,
  { intentionalConfig, intentionalSummary, analysisPath, analyzed },
) {
  const conversionPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath) || !intentionalConfig) return;

  const relAnalysis = path.relative(astroDir, analysisPath);
  const spotCheck = analyzed
    .filter((a) => a.intentionalDiffId)
    .map((a) => `\`${a.route}\` ${a.viewport}`)
    .join(", ");

  const block = [
    "",
    "## Visual diff intentional differences",
    "",
    `- **Config:** \`${intentionalConfig.configPath}\``,
    `- **Analysis:** \`${relAnalysis}\` (section Intentional differences)`,
    `- **Excluded from High:** ${intentionalSummary.excludedFromHigh} entry(ies)`,
    `- **True High remaining:** ${intentionalSummary.trueHigh}`,
    `- **Known intentional difference:** ${intentionalSummary.knownIntentional}`,
    `- **Spot-check anyway:** ${spotCheck || "—"}`,
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Visual diff intentional differences";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}\n${block}`;
  } else {
    content = `${content.trimEnd()}\n${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

export function writeVisualDiffAnalysisFromResults({
  outDir,
  astroDir,
  results,
  executedAt,
  compareRoutes,
  intentionalDiffsPath = null,
}) {
  const entries = [];
  for (const row of results) {
    for (const vp of row.viewports) {
      entries.push({
        route: row.route,
        viewport: vp.viewport,
        status: vp.status,
        sourceScreenshot: vp.sourceScreenshot,
        astroScreenshot: vp.astroScreenshot,
        diffScreenshot: vp.diffScreenshot,
        mismatchPercent: vp.mismatchPercent != null ? Number(vp.mismatchPercent) : null,
        error: vp.error,
        astroOnly: vp.status === "astro-only",
      });
    }
  }

  const intentionalConfig = intentionalDiffsPath ? loadIntentionalDiffs(intentionalDiffsPath) : null;
  const hints = parseConversionHints(astroDir ? path.join(astroDir, "CONVERSION_REPORT.md") : null);
  const analyzed = analyzeVisualDiffEntries(entries, hints, intentionalConfig);
  const intentionalSummary = summarizeIntentionalCounts(analyzed);
  const outResolved = path.resolve(outDir);
  const analysisPath = path.join(outResolved, "VISUAL_DIFF_ANALYSIS.md");
  const priorContent = fs.existsSync(analysisPath) ? fs.readFileSync(analysisPath, "utf8") : "";
  const phase2i = preserveTrailingSection(priorContent, "## Phase 2-I:");

  const analysis = formatVisualDiffAnalysis({
    outDir: outResolved,
    executedAt,
    compareRoutes,
    analyzed,
    hints,
    reportPath: path.join(outDir, "VISUAL_DIFF_REPORT.md"),
    intentionalConfig,
    intentionalSummary,
  });

  let body = analysis.content;
  if (phase2i && !body.includes("## Phase 2-I:")) {
    body = `${body.trimEnd()}\n\n${phase2i}`;
  }
  fs.writeFileSync(analysisPath, body, "utf8");

  if (astroDir) {
    const astroResolved = path.resolve(astroDir);
    appendAnalysisToConversionReport(astroResolved, {
      analysisPath,
      outAbs: outResolved,
      counts: analysis.counts,
      astroOnly: analysis.astroOnly,
      manualReview: analysis.manualReview,
      intentionalSummary,
    });
    appendIntentionalDiffsToConversionReport(astroResolved, {
      intentionalConfig,
      intentionalSummary,
      analysisPath,
      analyzed,
    });
  }

  return { analysisPath, counts: analysis.counts, analyzed, intentionalSummary };
}
