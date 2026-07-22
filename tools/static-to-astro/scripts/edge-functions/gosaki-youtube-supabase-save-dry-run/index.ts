/**
 * CMS Core v2 Phase 2 — YouTube Supabase Edge entry (LOCAL ONLY — do not deploy yet).
 * Staging target when approved: kmjqppxjdnwwrtaeqjta
 * Production STOP: vsbvndwuajjhnzpohghh
 * No service_role.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleYoutubeSupabaseSaveDryRunHttp } from "./handler.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authorizationHeader = req.headers.get("authorization");
  let body: unknown = undefined;
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid JSON body", didWrite: false }, 400);
    }
  }

  const result = await handleYoutubeSupabaseSaveDryRunHttp({
    method: req.method,
    contentType: req.headers.get("content-type") ?? "",
    body,
    authorizationHeader,
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  });

  return jsonResponse(result, result.status ?? 200);
});
