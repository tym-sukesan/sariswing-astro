/**
 * Minimal robots.txt helper for static-site crawler (G-7a).
 */

import { parseUrlSafe } from "./static-site-crawler-url.mjs";

/**
 * @param {string} robotsBody
 * @param {string} pathname
 * @param {string} userAgent
 */
export function isPathAllowedByRobots(robotsBody, pathname, userAgent = "*") {
  if (!robotsBody?.trim()) return true;

  const lines = robotsBody.split(/\r?\n/);
  /** @type {{ applies: boolean, rules: { type: 'allow'|'disallow', path: string }[] }[]} */
  const groups = [];
  let current = { applies: false, rules: [] };

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (current.rules.length > 0) groups.push(current);
      const ua = value.toLowerCase();
      current = {
        applies: ua === "*" || ua === userAgent.toLowerCase(),
        rules: [],
      };
      continue;
    }
    if (key === "disallow" && value) {
      current.rules.push({ type: "disallow", path: value });
    }
    if (key === "allow" && value) {
      current.rules.push({ type: "allow", path: value });
    }
  }
  if (current.rules.length > 0) groups.push(current);

  const applicable = groups.filter((g) => g.applies);
  if (applicable.length === 0) return true;

  let allowed = true;
  for (const group of applicable) {
    for (const rule of group.rules) {
      if (pathname.startsWith(rule.path)) {
        allowed = rule.type === "allow";
      }
    }
  }
  return allowed;
}

/**
 * @param {string} origin
 * @param {typeof fetch} fetchFn
 * @param {{ userAgent: string, timeoutMs: number }} options
 */
export async function fetchRobotsTxt(origin, fetchFn, options) {
  const robotsUrl = `${origin}/robots.txt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await fetchFn(robotsUrl, {
      headers: { "User-Agent": options.userAgent, Accept: "text/plain,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        ok: false,
        robotsUrl,
        status: res.status,
        body: "",
        error: `HTTP ${res.status}`,
      };
    }
    const body = await res.text();
    return { ok: true, robotsUrl, status: res.status, body, error: null };
  } catch (err) {
    return {
      ok: false,
      robotsUrl,
      status: 0,
      body: "",
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function isUrlAllowedByRobots(robotsBody, urlString, userAgent) {
  const url = parseUrlSafe(urlString);
  if (!url) return false;
  return isPathAllowedByRobots(robotsBody, url.pathname || "/", userAgent);
}
