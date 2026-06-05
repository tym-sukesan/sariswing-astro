import fs from "node:fs";
import path from "node:path";
import { routeToSlug } from "./route-map.mjs";

/**
 * Phase 2-I manual review records (gosaki High priority).
 * Updated after tooling fix + re-diff.
 */
export const GOSAKI_HIGH_REVIEW_BASELINE = [
  {
    route: "/about/",
    viewport: "mobile",
    mismatchBefore: 51.06,
    disposition: "Fix",
    causes: ["I", "C", "H"],
    observation:
      "修正前: ソース側が無スタイル（白背景・箇条書きナビ）。`/about/` 配信時に `css/style.css` が相対解決で404していた。修正後はスタイル適用で大幅改善見込み。残差分は Schedule 月別サブナビ（ソースのみ）vs 単独リンク（Astro意図）。",
    fixCandidate: "visual-diff ソースサーバーで HTML の css/images をルート相対化（実施済み）",
  },
  {
    route: "/contact/",
    viewport: "mobile",
    mismatchBefore: 40.36,
    disposition: "Review",
    causes: ["I", "C", "G", "H"],
    observation:
      "修正前: ソース無スタイル。スタイル適用後はフォームプレースホルダー枠・フッター有無で差が残る可能性。Wixフォーム代替テキストは fixture 上の意図的プレースホルダー（G/Review）。",
    fixCandidate: "ソースサーバー修正 + フォーム実装は Phase 3 以降",
  },
  {
    route: "/",
    viewport: "mobile",
    mismatchBefore: 40.17,
    disposition: "Intentional",
    causes: ["C", "H", "I"],
    observation:
      "修正前: ソースに Schedule 月別サブリンク5件がモバイルで常時表示（style.css @media）。Astro は Schedule 単独リンク + /schedule/ 一覧（Phase 2-E）。P1.1 デバッグ行は両方に存在。",
    fixCandidate: "ナビ仕様は意図的 — 変更不要",
  },
  {
    route: "/about/",
    viewport: "desktop",
    mismatchBefore: 29.21,
    disposition: "Fix",
    causes: ["I", "C"],
    observation:
      "修正前: 同上（深いパスで CSS 未読込）。デスクトップでもヘッダー高さ・ナビ構造差が残る可能性（Schedule ドロップダウン vs 単独）。",
    fixCandidate: "ソースサーバー修正（実施済み）",
  },
  {
    route: "/schedule-2026-07/",
    viewport: "mobile",
    mismatchBefore: 26.53,
    disposition: "Accept",
    causes: ["I", "C", "A"],
    observation:
      "修正前: CSS 未読込が主因の一つ。スタイル適用後はスケジュールカード・チラシ画像の微差、viewport 1200px クリップ差が残りうる。",
    fixCandidate: "ソースサーバー修正後に再評価 — 閾値下なら Accept",
  },
];

/**
 * @param {string} analysisPath
 * @param {object} options
 */
export function appendPhase2ISection(
  analysisPath,
  {
    rediff = null,
    toolingFix = "visual-diff-runner: rewriteSourceHtmlForRootServe() for `/about/` etc.",
  },
) {
  if (!fs.existsSync(analysisPath)) return;

  const lines = [
    "",
    "## Phase 2-I: High priority 目視確認・分類",
    "",
    "### ツール修正（Phase 2-I で実施）",
    "",
    `- **内容:** ${toolingFix}`,
    "- **理由:** トレーリングスラッシュ URL（`/about/` 等）で `href=\"css/style.css\"` が `/about/css/style.css` になり、ソースのみ CSS 未適用 → 見かけ上の巨大 diff",
    "- **範囲:** `tools/static-to-astro/scripts/lib/visual-diff-runner.mjs` のみ（変換ツール本体・本番 Astro には未適用）",
    "",
    "### High 差分の扱い（修正前 baseline 目視）",
    "",
    "| Route | Viewport | Before % | Disposition | Causes | 所見 |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of GOSAKI_HIGH_REVIEW_BASELINE) {
    lines.push(
      `| \`${row.route}\` | ${row.viewport} | ${row.mismatchBefore}% | **${row.disposition}** | ${row.causes.join(", ")} | ${row.observation.slice(0, 80)}… |`,
    );
  }

  lines.push("", "### Disposition 凡例", "");
  lines.push(
    "- **Fix:** 公開前に修正すべき（今回: visual-diff 比較条件のバグ）",
    "- **Accept:** 許容（軽微なレイアウト・画像差）",
    "- **Intentional:** Astro 意図的改善（Schedule ナビ）",
    "- **Review:** 人間判断（フォーム等）",
    "",
    "### 原因カテゴリ（追加分）",
    "",
    "- **I.** 撮影条件・比較環境差（viewport 固定高さ 1200px、ソース CSS 未読込による偽陽性）",
    "",
    "### 詳細所見",
    "",
  );

  for (const row of GOSAKI_HIGH_REVIEW_BASELINE) {
    lines.push(`#### \`${row.route}\` — ${row.viewport}`, "");
    lines.push(`- **Disposition:** ${row.disposition}`);
    lines.push(`- **Cause categories:** ${row.causes.join(", ")}`);
    lines.push(`- **Mismatch (before fix):** ${row.mismatchBefore}%`);
    lines.push(`- **Observation:** ${row.observation}`);
    lines.push(`- **Fix candidate:** ${row.fixCandidate}`);
    const slug = routeToSlug(row.route);
    lines.push(
      `- **Screenshots:** [source](./source/${slug}.${row.viewport}.png) | [astro](./astro/${slug}.${row.viewport}.png) | [diff](./diff/${slug}.${row.viewport}.png)`,
    );
    lines.push("");
  }

  if (rediff?.entries?.length) {
    lines.push("### 再 diff 結果（ソース CSS パス修正後）", "");
    lines.push(`- **Executed at:** ${rediff.executedAt ?? "—"}`);
    lines.push("", "| Route | Viewport | Before | After | Delta | Priority after |", "| --- | --- | --- | --- | --- | --- |");
    for (const e of rediff.entries) {
      const before = e.mismatchBefore ?? "—";
      const after = e.mismatchAfter != null ? `${e.mismatchAfter.toFixed(2)}%` : "—";
      const delta =
        e.mismatchBefore != null && e.mismatchAfter != null
          ? `${(e.mismatchAfter - e.mismatchBefore).toFixed(2)} pt`
          : "—";
      lines.push(
        `| \`${e.route}\` | ${e.viewport} | ${before}% | ${after} | ${delta} | ${e.priorityAfter ?? "—"} |`,
      );
    }
    lines.push("");
    lines.push("### 再 diff 後の推奨分類（目視 + 数値）", "");
    lines.push(
      "| Route | Viewport | After % | Disposition | 理由 |",
      "| --- | --- | --- | --- | --- |",
      "| `/` | mobile | 40.17% | **Intentional** | Schedule 月別サブナビ（ソース）vs 単独リンク（Astro Phase 2-E） |",
      "| `/about/` | mobile | 45.63% | **Intentional** | 同上 — CSS修正後もナビ行数差が支配的 |",
      "| `/about/` | desktop | 0.14% | **Accept** | ツール修正後は実質一致 |",
      "| `/contact/` | mobile | 40.14% | **Review** | ナビ差 + フッター SNS 配置；フォームプレースホルダーは fixture 意図 |",
      "| `/contact/` | desktop | 0.00% | **Accept** | 一致 |",
      "| `/schedule-2026-07/` | mobile | 25.94% | **Accept** | ナビ差が主；スケジュール本体は desktop 0.06% |",
      "| `/schedule-2026-07/` | desktop | 0.06% | **Accept** | 一致 |",
      "",
    );

    if (rediff.remainingHigh?.length) {
      lines.push("**Remaining High (自動閾値のみ — 上表のとおり多くは Intentional/Accept):**");
      for (const r of rediff.remainingHigh) {
        lines.push(`- \`${r.route}\` ${r.viewport} — ${r.mismatchAfter?.toFixed(2)}%`);
      }
      lines.push("");
    } else {
      lines.push("**Remaining High (threshold):** none", "");
    }
  }

  let content = fs.readFileSync(analysisPath, "utf8");
  const marker = "## Phase 2-I: High priority 目視確認・分類";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}\n${lines.join("\n")}`;
  } else {
    content = `${content.trimEnd()}\n${lines.join("\n")}`;
  }
  fs.writeFileSync(analysisPath, content, "utf8");
}

/**
 * @param {string} astroDir
 */
export function appendPhase2IToConversionReport(astroDir, { analysisRel, rediff }) {
  const conversionPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const highBefore = GOSAKI_HIGH_REVIEW_BASELINE.length;
  const fixCount = GOSAKI_HIGH_REVIEW_BASELINE.filter((r) => r.disposition === "Fix").length;
  const intentional = GOSAKI_HIGH_REVIEW_BASELINE.filter((r) => r.disposition === "Intentional").map(
    (r) => `\`${r.route}\` ${r.viewport}`,
  );

  const block = [
    "",
    "## Visual diff Phase 2-I (High review)",
    "",
    `- **Analysis detail:** \`${analysisRel}\` — section「Phase 2-I」`,
    `- **Tooling fix:** source static server rewrites relative \`css/\` / \`images/\` to root paths for fair comparison`,
    `- **High reviewed:** ${highBefore} entries — Fix ${fixCount}, Intentional ${intentional.length ? intentional.join(", ") : "—"}`,
    `- **Re-diff after fix:** ${rediff ? "yes — CSS path fix in visual-diff source server" : "pending"}`,
    rediff
      ? `- **Mismatch threshold High (auto):** ${rediff.remainingHigh?.length ? rediff.remainingHigh.map((r) => `\`${r.route}\` ${r.viewport}`).join(", ") : "none"}`
      : "",
    `- **Recommended:** treat remaining High as **Intentional** (nav) or **Review** (contact form) — see analysis Phase 2-I table`,
    `- **Next:** Phase 2-J — CI threshold, full-page capture, contact form backend`,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Visual diff Phase 2-I (High review)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}\n${block}`;
  } else {
    content = `${content.trimEnd()}\n${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

/**
 * Build rediff comparison from before snapshot + new analyzed rows.
 */
export function buildRediffSummary(beforeByKey, analyzed) {
  const entries = [];
  const remainingHigh = [];

  for (const row of analyzed) {
    const key = `${row.route}|${row.viewport}`;
    const before = beforeByKey.get(key);
    const after = row.mismatchPercent;
    const priorityAfter = row.priority;

    entries.push({
      route: row.route,
      viewport: row.viewport,
      mismatchBefore: before?.mismatchPercent ?? null,
      mismatchAfter: after,
      priorityAfter,
    });

    if (priorityAfter === "High") {
      remainingHigh.push({ route: row.route, viewport: row.viewport, mismatchAfter: after });
    }
  }

  return { entries, remainingHigh };
}
