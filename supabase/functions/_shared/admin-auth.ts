import { createClient, type User } from "npm:@supabase/supabase-js@2";

export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role;
  return role === "admin";
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
    return jsonResponse({ error: "Forbidden" }, 403);
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
