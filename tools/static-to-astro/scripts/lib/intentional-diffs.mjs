import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} route
 */
export function normalizeRoute(route) {
  if (!route) return "/";
  return route.endsWith("/") ? route : `${route}/`;
}

/**
 * @param {string} configPath
 */
export function loadIntentionalDiffs(configPath) {
  const abs = path.resolve(configPath);
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const rules = (raw.intentionalDiffs ?? []).map((rule) => ({
    ...rule,
    _specificity: rule.route ? 2 : rule.routePattern === "*" ? 0 : 1,
  }));
  rules.sort((a, b) => b._specificity - a._specificity);
  return {
    siteName: raw.siteName ?? "unknown",
    configPath: abs,
    intentionalDiffs: rules,
  };
}

/**
 * @param {object} entry { route, viewport, astroOnly? }
 * @param {ReturnType<typeof loadIntentionalDiffs>} config
 */
export function matchIntentionalDiff(entry, config) {
  if (!config?.intentionalDiffs?.length) return null;

  const route = normalizeRoute(entry.route);
  const vp = entry.viewport;

  for (const rule of config.intentionalDiffs) {
    if (rule.route) {
      if (normalizeRoute(rule.route) !== route) continue;
    } else if (rule.routePattern === "*") {
      // all routes
    } else {
      continue;
    }

    if (rule.viewport && rule.viewport !== "*" && rule.viewport !== vp) continue;
    return rule;
  }

  return null;
}

/**
 * @param {Array<object>} analyzed rows with rawPriority from assignPriority
 * @param {ReturnType<typeof loadIntentionalDiffs> | null} config
 */
export function applyIntentionalDiffAdjustments(analyzed, config) {
  return analyzed.map((row) => {
    const rawPriority = row.priority;
    const rule = config ? matchIntentionalDiff(row, config) : null;

    let adjustedPriority = rawPriority;
    if (rule) {
      if (row.astroOnly || row.status === "astro-only" || rule.category === "new-page") {
        adjustedPriority = "Known intentional difference";
      } else if (rawPriority === "High" || rawPriority === "Medium") {
        adjustedPriority = "Known intentional difference";
      } else if (rawPriority === "Low" && row.astroOnly) {
        adjustedPriority = "Known intentional difference";
      }
    }

    return {
      ...row,
      rawPriority,
      adjustedPriority,
      priority: adjustedPriority,
      intentionalDiffId: rule?.id ?? null,
      intentionalReason: rule?.reason ?? null,
      intentionalCategory: rule?.category ?? null,
    };
  });
}

/**
 * @param {Array<object>} analyzed
 */
export function summarizeIntentionalCounts(analyzed) {
  let trueHigh = 0;
  let knownIntentional = 0;
  let excludedFromHigh = 0;
  const counts = { High: 0, Medium: 0, Low: 0, "Known intentional difference": 0 };

  for (const row of analyzed) {
    counts[row.priority] = (counts[row.priority] ?? 0) + 1;
    if (row.intentionalDiffId) {
      knownIntentional += 1;
      if (row.rawPriority === "High") {
        excludedFromHigh += 1;
      }
    }
    if (row.rawPriority === "High" && !row.intentionalDiffId) {
      trueHigh += 1;
    }
  }

  return { trueHigh, knownIntentional, excludedFromHigh, counts };
}
