/**
 * G-20u36b / G-20u36d / G-20u36e / G-20u36f — Gosaki Discography Edge dry-run (+ controlled Save).
 * Endpoint: gosaki-discography-save-dry-run
 * Target: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta)
 * Controlled Save: allowlisted slices (G-20u36e forward · G-20u36f restore) · user JWT · no service_role.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createDefaultAnonSelectReadBackAdapter,
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
  authorizationHeader?: string | null;
}): Promise<Record<string, unknown>> {
  const readBackOptions = resolveReadBackOptions();
  return handleDiscographyEdgeDryRunHttpAsync(
    {
      method: input.method,
      contentType: input.contentType,
      body: input.body,
      authorizationHeader: input.authorizationHeader ?? null,
    },
    {
      ...readBackOptions,
      supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
      anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Forward Authorization to handler · never log header / token values.
  const authorizationHeader = req.headers.get("authorization");

  if (req.method !== "POST") {
    const result = await handleRequest({
      method: req.method,
      contentType: req.headers.get("content-type") ?? "",
      authorizationHeader,
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
      authorizationHeader,
    });
    return jsonResponse(result, result.status ?? 400);
  }

  const result = await handleRequest({
    method: req.method,
    contentType,
    body,
    authorizationHeader,
  });

  return jsonResponse(result, result.status ?? (result.ok ? 200 : 400));
});
