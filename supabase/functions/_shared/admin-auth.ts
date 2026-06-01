import { createClient, type User } from "npm:@supabase/supabase-js@2";

/** カンマ区切り。例: ADMIN_EMAILS=you@example.com,sari@example.com */
function getAdminEmailAllowlist(): Set<string> {
  const raw = Deno.env.get("ADMIN_EMAILS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminUser(user: User | null): boolean {
  if (!user) return false;

  if (user.app_metadata?.role === "admin") {
    return true;
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) return false;

  const allowlist = getAdminEmailAllowlist();
  if (allowlist.size === 0) return false;

  return allowlist.has(email);
}

export async function requireAdminUser(req: Request): Promise<{ user: User } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized("Missing Authorization header");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return unauthorized(error?.message ?? "Invalid session");
  }

  if (!isAdminUser(user)) {
    return jsonResponse(
      {
        error: "Forbidden",
        detail:
          "Admin access required (app_metadata.role=admin or email listed in ADMIN_EMAILS)",
      },
      403
    );
  }

  return { user };
}

export function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export function unauthorized(detail?: string) {
  return jsonResponse({ error: "Unauthorized", detail }, 401);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
