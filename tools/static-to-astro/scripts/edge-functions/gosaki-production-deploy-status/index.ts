/**
 * gosaki-production-deploy-status
 * JWT required · can_write_site · hardcoded workflow · no Deploy arm required
 * No service_role · kmjq only · owner/editor via can_write_site
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleGosakiProductionDeployStatusHttpAsync } from "./handler.ts";

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

function readEnv() {
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    githubToken: Deno.env.get("GITHUB_TOKEN") ?? "",
    githubRepo: Deno.env.get("GITHUB_REPO") ?? "",
    githubWorkflowFileEnv: Deno.env.get("GITHUB_WORKFLOW_FILE") ?? "",
    githubRefEnv: Deno.env.get("GITHUB_REF") ?? "",
    deployArmed: Deno.env.get("GOSAKI_PRODUCTION_DEPLOY_ARMED") ?? "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authorizationHeader = req.headers.get("authorization");
  let body: unknown = null;
  if (req.method === "POST") {
    const text = await req.text();
    if (text.trim()) {
      try {
        body = JSON.parse(text);
      } catch {
        return jsonResponse({ ok: false, errors: ["Invalid JSON"] }, 400);
      }
    }
  }

  const result = await handleGosakiProductionDeployStatusHttpAsync(
    {
      method: req.method,
      contentType: req.headers.get("content-type") ?? "",
      body,
      authorizationHeader,
    },
    readEnv(),
  );
  return jsonResponse(result, Number(result.httpStatus ?? (result.ok ? 200 : 400)));
});
