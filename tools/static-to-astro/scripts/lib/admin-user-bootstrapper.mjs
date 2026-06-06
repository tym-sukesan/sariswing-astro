/**
 * Auth admin user bootstrap + admin_users registration (Phase 3-O).
 * Staging only — no CMS table writes.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { preflightApplyEnv } from "./supabase-seed-inserter.mjs";
import { supabaseHostFromUrl } from "./supabase-json-exporter.mjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} toolRoot
 * @param {{ requireAnonKey?: boolean }} opts
 */
export function loadBootstrapEnv(toolRoot, { requireAnonKey = false } = {}) {
  const envPath = path.join(path.resolve(toolRoot), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found: ${envPath}\n` +
        "Copy .env.example and set staging credentials.",
    );
  }

  const raw = {};
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

  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  if (requireAnonKey) {
    required.push("SUPABASE_ANON_KEY");
  }

  const missing = required.filter((key) => !(key in raw) || !String(raw[key]).trim());
  if (missing.length > 0) {
    throw new Error(
      `.env.local is missing required keys:\n${missing.map((key) => `  - ${key}`).join("\n")}`,
    );
  }

  const { supabaseUrl, serviceRoleKey } = preflightApplyEnv(raw);
  const anonKey = (raw.SUPABASE_ANON_KEY ?? "").trim();
  const adminPassword = (raw.SUPABASE_ADMIN_PASSWORD ?? "").trim();

  if (requireAnonKey && !anonKey) {
    throw new Error("SUPABASE_ANON_KEY is empty (required for --apply sign-in verification).");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey: anonKey || null,
    adminPassword: adminPassword || null,
    host: supabaseHostFromUrl(supabaseUrl),
  };
}

/**
 * @param {string} email
 */
export function validateAdminEmail(email) {
  const trimmed = (email ?? "").trim();
  if (!trimmed) {
    return { valid: false, email: "", error: "Email is required" };
  }
  if (!EMAIL_RE.test(trimmed)) {
    return { valid: false, email: trimmed, error: "Invalid email format" };
  }
  return { valid: true, email: trimmed, error: null };
}

/**
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey?: string | null }} env
 */
async function createClients(env) {
  const { createClient } = await import("@supabase/supabase-js");
  const service = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = env.anonKey
    ? createClient(env.supabaseUrl, env.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return { service, anon };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
async function countAdminUsers(service) {
  const { count, error } = await service
    .from("admin_users")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`admin_users count: ${error.message}`);
  return count ?? 0;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {string} email
 */
async function findAuthUserByEmail(service, email) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);

    const users = data?.users ?? [];
    const match = users.find((user) => (user.email ?? "").toLowerCase() === normalized);
    if (match) return match;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

/**
 * @param {{ cliPassword?: string | null, envPassword?: string | null, userExists: boolean }} opts
 */
export function resolveBootstrapPassword({ cliPassword, envPassword, userExists }) {
  const fromCli = (cliPassword ?? "").trim();
  if (fromCli) {
    return {
      password: fromCli,
      source: userExists ? "cli-existing-user" : "cli",
      skipSignIn: false,
    };
  }

  const fromEnv = (envPassword ?? "").trim();
  if (fromEnv) {
    return {
      password: fromEnv,
      source: userExists ? "env-existing-user" : "env",
      skipSignIn: false,
    };
  }

  if (userExists) {
    return { password: null, source: "not-needed-existing-user", skipSignIn: true };
  }

  const generated = crypto.randomBytes(24).toString("base64url");
  return { password: generated, source: "auto-generated", skipSignIn: false };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {string} email
 * @param {string} password
 */
async function createAuthUser(service, email, password) {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  if (!data.user?.id) throw new Error("createUser: no user id returned");
  return data.user;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {{ userId: string, email: string }} row
 */
async function upsertAdminUser(service, { userId, email }) {
  const { data, error } = await service
    .from("admin_users")
    .upsert({ user_id: userId, email, role: "admin" }, { onConflict: "user_id" })
    .select("user_id,email,role")
    .single();

  if (error) throw new Error(`admin_users upsert: ${error.message}`);
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {string} email
 */
async function fetchAdminUserByEmail(service, email) {
  const { data, error } = await service
    .from("admin_users")
    .select("user_id,email,role")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`admin_users select: ${error.message}`);
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} anon
 * @param {string} email
 * @param {string} password
 */
async function verifySignIn(anon, email, password) {
  if (!password) {
    return {
      ok: false,
      skipped: true,
      reason: "No password available (existing user reuse — password not changed)",
      userId: null,
    };
  }

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, skipped: false, reason: error.message, userId: null };
  }

  const userId = data.user?.id ?? null;
  return {
    ok: Boolean(userId),
    skipped: false,
    reason: userId ? null : "sign-in returned no user id",
    userId,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client authenticated session client
 */
async function verifyIsAdminRpc(client) {
  const { data, error } = await client.rpc("is_admin");

  if (error) {
    return { ok: false, value: null, error: error.message };
  }

  return { ok: data === true, value: data, error: null };
}

/**
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey?: string | null, host: string, adminPassword?: string | null }} env
 * @param {{ email: string, apply?: boolean, cliPassword?: string | null }} opts
 */
export async function runAdminUserBootstrap(env, { email, apply = false, cliPassword = null } = {}) {
  const emailCheck = validateAdminEmail(email);
  const result = {
    mode: apply ? "apply" : "dry-run",
    host: env.host,
    email: emailCheck.email,
    emailValid: emailCheck.valid,
    emailError: emailCheck.error,
    envKeysPresent: {
      supabaseUrl: Boolean(env.supabaseUrl),
      serviceRoleKey: Boolean(env.serviceRoleKey),
      anonKey: Boolean(env.anonKey),
      adminPasswordEnv: Boolean(env.adminPassword),
    },
    adminUsersCountBefore: null,
    adminUsersCountAfter: null,
    authAction: null,
    authUserId: null,
    adminUsersUpsert: null,
    passwordSource: null,
    signIn: null,
    isAdmin: null,
    cmsTablesWritten: false,
    errors: [],
    passed: false,
  };

  if (!emailCheck.valid) {
    result.errors.push(emailCheck.error ?? "Invalid email");
    return result;
  }

  const { service, anon } = await createClients(env);

  try {
    result.adminUsersCountBefore = await countAdminUsers(service);

    if (!apply) {
      result.passed = true;
      return result;
    }

    if (!env.anonKey) {
      throw new Error("SUPABASE_ANON_KEY required for --apply");
    }

    const existingAuth = await findAuthUserByEmail(service, emailCheck.email);
    const passwordResolution = resolveBootstrapPassword({
      cliPassword,
      envPassword: env.adminPassword,
      userExists: Boolean(existingAuth),
    });
    result.passwordSource = passwordResolution.source;

    if (!existingAuth && !passwordResolution.password) {
      throw new Error(
        "Password required for new Auth user: set SUPABASE_ADMIN_PASSWORD in .env.local or use --password",
      );
    }

    let authUser = existingAuth;
    if (authUser) {
      result.authAction = "reused-existing";
      result.authUserId = authUser.id;
    } else {
      authUser = await createAuthUser(service, emailCheck.email, passwordResolution.password);
      result.authAction = "created";
      result.authUserId = authUser.id;
    }

    result.adminUsersUpsert = await upsertAdminUser(service, {
      userId: authUser.id,
      email: emailCheck.email,
    });

    const adminRow = await fetchAdminUserByEmail(service, emailCheck.email);
    if (!adminRow || adminRow.user_id !== authUser.id || adminRow.role !== "admin") {
      throw new Error("admin_users verification failed after upsert");
    }

    result.adminUsersCountAfter = await countAdminUsers(service);

    const signInPassword = passwordResolution.skipSignIn ? null : passwordResolution.password;

    result.signIn = await verifySignIn(anon, emailCheck.email, signInPassword);

    if (result.signIn.ok && signInPassword) {
      result.isAdmin = await verifyIsAdminRpc(anon);
      await anon.auth.signOut();
    } else if (result.signIn.skipped) {
      result.isAdmin = {
        ok: null,
        value: null,
        error: null,
        note: "Skipped — no password available for existing user; set SUPABASE_ADMIN_PASSWORD or use Dashboard reset",
      };
    } else {
      result.isAdmin = {
        ok: false,
        value: null,
        error: result.signIn.reason ?? "sign-in failed",
      };
    }

    result.passed =
      Boolean(result.authUserId) &&
      Boolean(result.adminUsersUpsert) &&
      adminRow.role === "admin" &&
      (result.signIn.ok || result.signIn.skipped) &&
      (result.isAdmin.ok === true || result.isAdmin.ok === null);

    return result;
  } catch (err) {
    result.errors.push(err.message);
    result.passed = false;
    return result;
  }
}

/**
 * @param {{ reportPath: string, result: object, elapsedMs: number }} opts
 */
export function formatAdminBootstrapReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_USER_BOOTSTRAP_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Mode: **${result.mode === "apply" ? "APPLY" : "DRY-RUN"}**`,
    `Supabase host: \`${result.host}\``,
    `Email: \`${result.email || "(not set)"}\``,
    "Keys / password / tokens: *(not logged)*",
    "",
  ];

  lines.push(
    "## Email validation",
    "",
    `- Valid: ${result.emailValid ? "yes" : "no"}`,
  );
  if (result.emailError) {
    lines.push(`- Error: ${result.emailError}`);
  }
  lines.push("");

  if (result.envKeysPresent) {
    lines.push("## Environment keys (.env.local)", "");
    lines.push(`- SUPABASE_URL: ${result.envKeysPresent.supabaseUrl ? "set" : "missing"}`);
    lines.push(
      `- SUPABASE_SERVICE_ROLE_KEY: ${result.envKeysPresent.serviceRoleKey ? "set" : "missing"}`,
    );
    lines.push(`- SUPABASE_ANON_KEY: ${result.envKeysPresent.anonKey ? "set" : "missing"}`);
    lines.push(
      `- SUPABASE_ADMIN_PASSWORD: ${result.envKeysPresent.adminPasswordEnv ? "set" : "not set"}`,
    );
    lines.push("");
  }

  if (result.adminUsersCountBefore != null) {
    lines.push(`## admin_users count (before): ${result.adminUsersCountBefore}`, "");
  }

  if (result.mode === "dry-run") {
    lines.push(
      "## Dry-run plan",
      "",
      "No Auth user creation or admin_users writes performed. With `--apply`, the script will:",
      "",
      "1. Find existing Auth user by email, or create via Admin API (service role)",
      "2. Upsert `admin_users` (`user_id`, `email`, `role=admin`) — **admin_users only**",
      "3. Verify row via service role",
      "4. Sign in with anon client + password (if available) — tokens not logged",
      "5. Call `is_admin()` RPC with authenticated session when sign-in succeeds",
      "",
      "**Password (recommended):** set `SUPABASE_ADMIN_PASSWORD` in `.env.local` (not Git).",
      "Existing Auth users are reused; passwords are not changed.",
      "",
      "**Not in scope:** CMS table insert/update/delete; Admin UI save enablement.",
      "",
    );
  }

  if (result.mode === "apply") {
    lines.push(
      "## Apply results",
      "",
      `- Auth action: ${result.authAction ?? "n/a"}`,
      `- Auth user id present: ${result.authUserId ? "yes" : "no"}`,
      `- Password source: ${result.passwordSource ?? "n/a"}`,
      `- admin_users upsert: ${result.adminUsersUpsert ? "ok" : "failed"}`,
      "",
    );

    if (result.adminUsersUpsert) {
      lines.push(
        "### admin_users row (service role)",
        "",
        `- user_id matches Auth: ${result.adminUsersUpsert.user_id === result.authUserId ? "yes" : "no"}`,
        `- email: \`${result.adminUsersUpsert.email}\``,
        `- role: \`${result.adminUsersUpsert.role}\``,
        "",
      );
    }

    if (result.adminUsersCountAfter != null) {
      lines.push(`## admin_users count (after): ${result.adminUsersCountAfter}`, "");
    }

    if (result.signIn) {
      lines.push(
        "## Sign-in verification (anon client)",
        "",
        `- Attempted: ${result.signIn.skipped ? "skipped (existing user)" : "yes"}`,
        `- OK: ${result.signIn.ok ? "yes" : result.signIn.skipped ? "n/a" : "no"}`,
      );
      if (result.signIn.reason && !result.signIn.skipped) {
        lines.push(`- Note: ${result.signIn.reason}`);
      }
      lines.push("");
    }

    if (result.isAdmin) {
      lines.push(
        "## is_admin() RPC",
        "",
        `- OK: ${result.isAdmin.ok === true ? "yes" : result.isAdmin.ok === null ? "skipped" : "no"}`,
      );
      if (result.isAdmin.value != null) {
        lines.push(`- Returned: \`${result.isAdmin.value}\``);
      }
      if (result.isAdmin.note) {
        lines.push(`- Note: ${result.isAdmin.note}`);
      }
      if (result.isAdmin.error) {
        lines.push(`- Error: ${result.isAdmin.error}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "## Safety",
    "",
    "- CMS tables (schedule_months, schedules, discography, discography_tracks): **no writes**",
    "- Writes limited to: Auth user (create if missing) + `admin_users` upsert (`--apply` only)",
    "- Service role / anon keys, password, access token: **not logged**",
    "- Existing Auth users: not deleted; passwords not changed on reuse",
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
    "- Phase 3-P: Admin save via authenticated server routes + is_admin() in API",
    "- Phase 3-Q: Production Auth / admin bootstrap review",
    "- Admin UI save: still disabled",
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
 * @param {{ passed: boolean, mode: string, host: string, email: string }} summary
 */
export function appendPhase3OToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin user bootstrap (Phase 3-O)",
    "",
    `- **Mode:** ${summary.mode}`,
    `- **Host:** \`${summary.host}\``,
    `- **Email:** \`${summary.email}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **CMS writes:** none`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_USER_BOOTSTRAP_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin user bootstrap (Phase 3-O)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
