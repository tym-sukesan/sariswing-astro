/**
 * Server-side Admin API auth helpers (Phase 3-P-A).
 * Import only from API routes / server code — never from client bundles.
 */

import { createClient } from "@supabase/supabase-js";

export interface AdminMeResult {
  ok: boolean;
  authenticated: boolean;
  admin: boolean;
  email?: string;
  error?: string;
}

function readServerEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name]?.trim();
  return fromMeta || undefined;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function getSupabaseConfig() {
  const supabaseUrl = readServerEnv("SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = readServerEnv("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return {
      ok: false as const,
      error: "Server configuration error (missing Supabase env)",
    };
  }

  return {
    ok: true as const,
    supabaseUrl,
    serviceRoleKey,
    anonKey,
  };
}

/**
 * Resolve /api/admin/me.json response from Authorization bearer token.
 */
export async function resolveAdminMe(accessToken: string | null): Promise<AdminMeResult> {
  const config = getSupabaseConfig();
  if (!config.ok) {
    return {
      ok: false,
      authenticated: false,
      admin: false,
      error: config.error,
    };
  }

  if (!accessToken) {
    return { ok: true, authenticated: false, admin: false };
  }

  const authClient = createClient(config.supabaseUrl, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return { ok: true, authenticated: false, admin: false };
  }

  const user = userData.user;
  const serviceClient = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminRow, error: adminError } = await serviceClient
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError) {
    return {
      ok: false,
      authenticated: true,
      admin: false,
      email: user.email ?? undefined,
      error: "Admin lookup failed",
    };
  }

  const isAdmin = Boolean(adminRow);
  return {
    ok: true,
    authenticated: true,
    admin: isAdmin,
    email: user.email ?? undefined,
  };
}

export function adminMeJsonResponse(result: AdminMeResult, status = 200): Response {
  const body: Record<string, unknown> = {
    ok: result.ok,
    authenticated: result.authenticated,
    admin: result.admin,
  };

  if (result.email) {
    body.email = result.email;
  }

  if (result.error) {
    body.error = result.error;
  }

  return jsonResponse(body, status);
}

export type AdminAuthGate =
  | { ok: true; accessToken: string; email?: string }
  | { ok: false; status: 401 | 403 | 500; error: "unauthenticated" | "forbidden" | string };

/**
 * Require Bearer token + admin_users admin role (Phase 3-P-B+).
 */
export async function requireAdminAuth(request: Request): Promise<AdminAuthGate> {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }

  const me = await resolveAdminMe(token);
  if (!me.ok && me.error) {
    return { ok: false, status: 500, error: me.error };
  }
  if (!me.authenticated) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }
  if (!me.admin) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  return { ok: true, accessToken: token, email: me.email };
}

export function adminApiErrorResponse(
  error: "unauthenticated" | "forbidden" | "not_found" | "validation_error" | string,
  status: number,
): Response {
  return jsonResponse({ ok: false, error }, status);
}

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function getServiceRoleClient() {
  const config = getSupabaseConfig();
  if (!config.ok) {
    return { ok: false as const, error: config.error };
  }

  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { ok: true as const, client, supabaseUrl: config.supabaseUrl };
}
