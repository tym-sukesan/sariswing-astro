/**
 * G-20u36b — Gosaki Discography Edge dry-run endpoint (root source · NOT deployed).
 * Endpoint: gosaki-discography-save-dry-run
 * Target: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta) — deploy in separate phase only.
 * Copied from tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts
 * Edge deploy: NOT EXECUTED in G-20u36b root-placement phase.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleDiscographyEdgeDryRunHttp } from "./handler.ts";

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

  if (req.method !== "POST") {
    const result = handleDiscographyEdgeDryRunHttp({
      method: req.method,
      contentType: req.headers.get("content-type") ?? "",
    });
    return jsonResponse(result, result.status ?? 405);
  }

  const contentType = req.headers.get("content-type") ?? "";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const result = handleDiscographyEdgeDryRunHttp({
      method: req.method,
      contentType,
      body: null,
    });
    return jsonResponse(result, result.status ?? 400);
  }

  const result = handleDiscographyEdgeDryRunHttp({
    method: req.method,
    contentType,
    body,
  });

  return jsonResponse(result, result.status ?? (result.ok ? 200 : 400));
});
