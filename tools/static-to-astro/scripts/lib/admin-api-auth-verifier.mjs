/**
 * Admin API auth verification (Phase 3-P-A).
 * Builds generated-astro, runs dev server, tests /api/admin/me.json.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { loadBootstrapEnv, validateAdminEmail } from "./admin-user-bootstrapper.mjs";
import { supabaseHostFromUrl } from "./supabase-json-exporter.mjs";

export const ADMIN_ME_ENDPOINT = "/api/admin/me.json";

/**
 * @param {string} toolRoot
 */
export function loadAdminApiEnv(toolRoot) {
  const envPath = path.join(path.resolve(toolRoot), ".env.local");
  const raw = {};

  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      raw[trimmed.slice(0, eq).trim()] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }

  const bootstrap = loadBootstrapEnv(toolRoot, { requireAnonKey: true });

  return {
    ...bootstrap,
    adminEmail: (raw.SUPABASE_ADMIN_EMAIL ?? "").trim() || null,
    adminPassword: bootstrap.adminPassword,
  };
}

/**
 * @param {{ cliEmail?: string | null, envEmail?: string | null, repoRoot?: string }} opts
 */
export function resolveAdminEmailForVerify({ cliEmail, envEmail, repoRoot }) {
  if (cliEmail?.trim()) {
    const check = validateAdminEmail(cliEmail);
    if (!check.valid) throw new Error(check.error ?? "Invalid --email");
    return check.email;
  }

  if (envEmail?.trim()) {
    const check = validateAdminEmail(envEmail);
    if (!check.valid) throw new Error(`SUPABASE_ADMIN_EMAIL invalid: ${check.error}`);
    return check.email;
  }

  const git = spawnSync("git", ["config", "user.email"], {
    cwd: repoRoot ?? process.cwd(),
    encoding: "utf8",
  });
  const gitEmail = git.stdout?.trim();
  if (gitEmail) {
    const check = validateAdminEmail(gitEmail);
    if (check.valid) return check.email;
  }

  throw new Error(
    "Admin email required: use --email, set SUPABASE_ADMIN_EMAIL in .env.local, or configure git user.email",
  );
}

/**
 * @param {string} dir
 * @param {string[]} secrets
 */
export function scanDirForSecrets(dir, secrets) {
  const hits = [];
  if (!fs.existsSync(dir)) return hits;

  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        stack.push(full);
        continue;
      }
      if (!/\.(html|js|css|json|mjs|txt)$/i.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      for (const secret of secrets) {
        if (secret && secret.length >= 12 && content.includes(secret)) {
          hits.push({ file: full, kind: classifySecret(secret, secrets) });
        }
      }
    }
  }

  return hits;
}

/**
 * @param {string} secret
 * @param {string[]} all
 */
function classifySecret(secret, all) {
  const idx = all.indexOf(secret);
  const labels = ["service_role_key", "admin_password", "access_token", "refresh_token"];
  return labels[idx] ?? "secret";
}

/**
 * @param {string} astroDir
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey: string | null }} env
 */
export function runAstroBuild(astroDir, env) {
  const install = spawnSync("npm", ["install"], {
    cwd: astroDir,
    encoding: "utf8",
    env: buildAstroProcessEnv(env),
  });

  if (install.status !== 0) {
    return {
      ok: false,
      error: install.stderr || install.stdout || "npm install failed",
      elapsedMs: 0,
    };
  }

  const started = Date.now();
  const build = spawnSync("npm", ["run", "build"], {
    cwd: astroDir,
    encoding: "utf8",
    env: buildAstroProcessEnv(env),
  });

  return {
    ok: build.status === 0,
    error: build.status === 0 ? null : build.stderr || build.stdout || "npm run build failed",
    elapsedMs: Date.now() - started,
  };
}

/**
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey: string | null }} env
 */
function buildAstroProcessEnv(env) {
  return {
    ...process.env,
    SUPABASE_URL: env.supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: env.serviceRoleKey,
    SUPABASE_ANON_KEY: env.anonKey ?? "",
  };
}

const DEFAULT_DEV_PORT_START = 4322;
const DEV_PORT_SCAN_ATTEMPTS = 30;

/**
 * @param {string | null | undefined} text
 * @param {number} [maxLines]
 */
export function tailOutput(text, maxLines = 40) {
  const lines = (text ?? "").split("\n").filter((line) => line.trim());
  if (lines.length <= maxLines) return lines.join("\n");
  return lines.slice(-maxLines).join("\n");
}

/**
 * @param {number} port
 */
export function isPortInUse(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  return Boolean(result.stdout?.trim());
}

/**
 * @param {number} [startPort]
 * @param {number} [maxAttempts]
 */
export function findAvailableDevPort(startPort = DEFAULT_DEV_PORT_START, maxAttempts = DEV_PORT_SCAN_ATTEMPTS) {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const port = startPort + offset;
    if (!isPortInUse(port)) return port;
  }
  return startPort;
}

/**
 * @param {number} port
 */
export function killProcessesOnPort(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  const pids = (result.stdout ?? "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((pid) => Number(pid))
    .filter((pid) => Number.isFinite(pid) && pid > 0);

  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // ignore
    }
  }

  if (pids.length > 0) {
    spawnSync("sleep", ["0.3"]);
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // ignore
      }
    }
  }

  return pids.length;
}

/**
 * @param {import('node:child_process').ChildProcess | null | undefined} child
 */
export function stopDevServer(child) {
  if (!child || child.killed || !child.pid) return;

  const pid = child.pid;
  spawnSync("pkill", ["-TERM", "-P", String(pid)], { stdio: "ignore" });
  try {
    child.kill("SIGTERM");
  } catch {
    // ignore
  }

  spawnSync("sleep", ["0.3"]);
  spawnSync("pkill", ["-KILL", "-P", String(pid)], { stdio: "ignore" });
  try {
    if (!child.killed) child.kill("SIGKILL");
  } catch {
    // ignore
  }
}

/**
 * @param {string} astroDir
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey: string | null }} env
 * @param {number} port
 */
export function startAstroDev(astroDir, env, port) {
  const child = spawn("npm", ["run", "dev", "--", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: astroDir,
    env: buildAstroProcessEnv(env),
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });

  return child;
}

/**
 * @param {import('node:child_process').ChildProcess} child
 * @param {number} timeoutMs
 */
export function waitForDevServer(child, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let buffer = "";

    const rejectWithOutput = (message) => {
      const err = new Error(message);
      err.outputTail = tailOutput(buffer);
      reject(err);
    };

    const onData = (chunk) => {
      buffer += chunk.toString();
      if (/Local\s+https?:\/\//i.test(buffer) || /ready in \d+/i.test(buffer)) {
        cleanup();
        resolve(true);
      }
    };

    const onError = (err) => {
      cleanup();
      err.outputTail = tailOutput(buffer);
      reject(err);
    };

    const onExit = (code) => {
      cleanup();
      rejectWithOutput(`astro dev exited early (code ${code})`);
    };

    const timer = setInterval(() => {
      if (Date.now() - started > timeoutMs) {
        cleanup();
        rejectWithOutput("Timed out waiting for astro dev");
      }
    }, 500);

    function cleanup() {
      clearInterval(timer);
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
      child.off("error", onError);
      child.off("exit", onExit);
    }

    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", onError);
    child.on("exit", onExit);
  });
}

/**
 * @param {string} baseUrl
 * @param {string} [token]
 */
export async function fetchAdminMe(baseUrl, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(new URL(ADMIN_ME_ENDPOINT, baseUrl), { headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${ADMIN_ME_ENDPOINT}: ${text.slice(0, 120)}`);
  }
  return { status: res.status, json };
}

/**
 * @param {{ supabaseUrl: string, anonKey: string, email: string, password: string }} opts
 */
export async function signInAdminUser({ supabaseUrl, anonKey, email, password }) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signInWithPassword: ${error.message}`);

  const accessToken = data.session?.access_token;
  const refreshToken = data.session?.refresh_token;
  if (!accessToken) throw new Error("signInWithPassword: no access token");

  return { accessToken, refreshToken: refreshToken ?? null, client };
}

/**
 * @param {{ astroDir: string, env: object, email: string, port?: number, skipBuild?: boolean, repoRoot?: string }} opts
 */
export async function runAdminApiAuthVerification({
  astroDir,
  env,
  email,
  port = 4321,
  skipBuild = false,
  repoRoot,
}) {
  const result = {
    host: env.host,
    endpoint: ADMIN_ME_ENDPOINT,
    email,
    build: null,
    unauthenticated: null,
    authenticatedAdmin: null,
    keyLeakScan: null,
    cmsWrites: false,
    adminUsersWrites: false,
    errors: [],
    passed: false,
  };

  if (!env.adminPassword) {
    throw new Error("SUPABASE_ADMIN_PASSWORD required in .env.local for sign-in verification");
  }

  if (!skipBuild) {
    result.build = runAstroBuild(astroDir, env);
    if (!result.build.ok) {
      result.errors.push(result.build.error ?? "build failed");
      return result;
    }
  } else {
    result.build = { ok: true, skipped: true, elapsedMs: 0 };
  }

  const distDir = path.join(astroDir, "dist");
  const child = startAstroDev(astroDir, env, port);
  const baseUrl = `http://127.0.0.1:${port}/`;

  try {
    await waitForDevServer(child, 90000);

    const unauth = await fetchAdminMe(baseUrl);
    result.unauthenticated = {
      status: unauth.status,
      authenticated: unauth.json.authenticated,
      admin: unauth.json.admin,
      ok:
        unauth.json.authenticated === false &&
        unauth.json.admin === false &&
        unauth.status === 200,
    };

    const { accessToken, refreshToken } = await signInAdminUser({
      supabaseUrl: env.supabaseUrl,
      anonKey: env.anonKey,
      email,
      password: env.adminPassword,
    });

    const auth = await fetchAdminMe(baseUrl, accessToken);
    result.authenticatedAdmin = {
      status: auth.status,
      authenticated: auth.json.authenticated,
      admin: auth.json.admin,
      email: auth.json.email ?? null,
      ok:
        auth.json.authenticated === true &&
        auth.json.admin === true &&
        auth.status === 200,
    };

    const secrets = [
      env.serviceRoleKey,
      env.adminPassword,
      accessToken,
      refreshToken,
    ].filter(Boolean);

    const hits = scanDirForSecrets(distDir, secrets);
    result.keyLeakScan = {
      ok: hits.length === 0,
      hitCount: hits.length,
      files: hits.map((hit) => path.relative(astroDir, hit.file)),
      kinds: [...new Set(hits.map((hit) => hit.kind))],
    };

    result.passed =
      result.build.ok &&
      result.unauthenticated.ok &&
      result.authenticatedAdmin.ok &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);
    result.passed = false;
    return result;
  } finally {
    if (child.pid) {
      child.kill("SIGTERM");
    }
  }
}

/**
 * @param {{ reportPath: string, result: object, elapsedMs: number }} opts
 */
export function formatAdminApiAuthReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_API_AUTH_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **verify**",
    `Supabase host: \`${result.host}\``,
    `Endpoint: \`${result.endpoint}\``,
    `Admin email: \`${result.email}\``,
    "Secrets: *(not logged)*",
    "",
  ];

  if (result.build) {
    lines.push(
      "## Build",
      "",
      `- Success: ${result.build.ok ? "yes" : "no"}`,
      `- Skipped: ${result.build.skipped ? "yes" : "no"}`,
      result.build.elapsedMs != null ? `- Elapsed: ${result.build.elapsedMs}ms` : "",
      "",
    );
  }

  if (result.unauthenticated) {
    lines.push(
      "## Unauthenticated request",
      "",
      `- HTTP status: ${result.unauthenticated.status}`,
      `- authenticated: ${result.unauthenticated.authenticated}`,
      `- admin: ${result.unauthenticated.admin}`,
      `- OK: ${result.unauthenticated.ok ? "yes" : "no"}`,
      "",
    );
  }

  if (result.authenticatedAdmin) {
    lines.push(
      "## Authenticated admin request",
      "",
      `- HTTP status: ${result.authenticatedAdmin.status}`,
      `- authenticated: ${result.authenticatedAdmin.authenticated}`,
      `- admin: ${result.authenticatedAdmin.admin}`,
      `- response email: \`${result.authenticatedAdmin.email ?? "—"}\``,
      `- OK: ${result.authenticatedAdmin.ok ? "yes" : "no"}`,
      "",
    );
  }

  if (result.keyLeakScan) {
    lines.push(
      "## Key leak scan (dist/)",
      "",
      `- OK: ${result.keyLeakScan.ok ? "yes" : "no"}`,
      `- Hits: ${result.keyLeakScan.hitCount}`,
    );
    if (result.keyLeakScan.kinds?.length) {
      lines.push(`- Kinds detected: ${result.keyLeakScan.kinds.join(", ")} (values not logged)`);
    }
    lines.push("");
  }

  lines.push(
    "## Safety",
    "",
    "- CMS table writes: **none**",
    "- admin_users writes: **none**",
    "- Auth user creation: **none**",
    "- service role key / anon key / password / tokens: **not logged**",
    "",
    "## Overall",
    "",
    result.passed ? "**PASS**" : "**FAIL**",
    "",
  );

  if (result.errors.length) {
    lines.push("### Errors", "");
    for (const err of result.errors) {
      lines.push(`- ${err}`);
    }
    lines.push("");
  }

  lines.push(
    "## Next phases",
    "",
    "- Phase 3-P-B: Admin save API routes (authenticated + is_admin)",
    "- Phase 3-Q: Production Auth / admin bootstrap review",
    "- Admin UI save enablement (after save API)",
    "",
    "---",
    `Elapsed: ${elapsedMs}ms`,
    `Report: \`${reportPath}\``,
    "",
  );

  return lines.join("\n");
}

/**
 * @param {string} astroDir
 * @param {{ passed: boolean, host: string, endpoint: string }} summary
 */
export function appendPhase3PAToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin API auth (Phase 3-P-A)",
    "",
    `- **Endpoint:** \`${summary.endpoint}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **CMS writes:** none`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_API_AUTH_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin API auth (Phase 3-P-A)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
