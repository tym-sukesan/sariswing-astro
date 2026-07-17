/**
 * G-20u45 — Gosaki Schedule Edge dry-run entry.
 * Endpoint: gosaki-schedule-save-dry-run
 * dryRun only · no Save · no service_role · staging-only
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleScheduleEdgeDryRunHttpAsync } from "./handler.ts";

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

  if (req.method !== "POST") {
    const result = await handleScheduleEdgeDryRunHttpAsync(
      {
        method: req.method,
        contentType: req.headers.get("content-type") ?? "",
        authorizationHeader,
      },
      {
        supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
        anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
    );
    return jsonResponse(result, Number(result.status ?? 405));
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const result = await handleScheduleEdgeDryRunHttpAsync(
      {
        method: req.method,
        contentType,
        body: null,
        authorizationHeader,
      },
      {
        supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
        anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
    );
    return jsonResponse(result, Number(result.status ?? 400));
  }

  const result = await handleScheduleEdgeDryRunHttpAsync(
    {
      method: req.method,
      contentType,
      body,
      authorizationHeader,
    },
    {
      supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
      anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
  );

  return jsonResponse(result, Number(result.status ?? (result.ok ? 200 : 400)));
});
