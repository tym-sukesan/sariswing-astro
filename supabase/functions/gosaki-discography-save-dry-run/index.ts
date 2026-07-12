/**
 * G-20u36b / G-20u36d — Gosaki Discography Edge dry-run endpoint (root source · NOT deployed).
 * Endpoint: gosaki-discography-save-dry-run
 * Target: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta) — deploy in separate phase only.
 * Copied from tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts
 * G-20u36d release-id select fix root placement · Edge deploy NOT EXECUTED.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createDefaultAnonSelectReadBackAdapter,
  handleDiscographyEdgeDryRunHttp,
  handleDiscographyEdgeDryRunHttpAsync,
} from "./handler.ts";

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

function resolveReadBackOptions() {
  const readBackEnabled = Deno.env.get("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED") === "true";
  if (!readBackEnabled) {
    return { readBackEnabled: false, readBackAdapter: null };
  }
  try {
    const readBackAdapter = createDefaultAnonSelectReadBackAdapter({
      fetch: globalThis.fetch.bind(globalThis),
      supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
      anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    });
    return { readBackEnabled: true, readBackAdapter };
  } catch {
    return { readBackEnabled: false, readBackAdapter: null };
  }
}

async function handleRequest(input: {
  method: string;
  contentType: string;
  body?: unknown;
}): Promise<Record<string, unknown>> {
  const readBackOptions = resolveReadBackOptions();
  if (readBackOptions.readBackEnabled && readBackOptions.readBackAdapter) {
    return handleDiscographyEdgeDryRunHttpAsync(input, readBackOptions);
  }
  return handleDiscographyEdgeDryRunHttp(input);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    const result = await handleRequest({
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
    const result = await handleRequest({
      method: req.method,
      contentType,
      body: null,
    });
    return jsonResponse(result, result.status ?? 400);
  }

  const result = await handleRequest({
    method: req.method,
    contentType,
    body,
  });

  return jsonResponse(result, result.status ?? (result.ok ? 200 : 400));
});
