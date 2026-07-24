/**
 * LOCAL IMPLEMENTATION — Edge deploy is a later operator-approved phase.
 * Do not deploy without explicit AGENTS approval.
 */

import { handleAboutSupabaseSaveDryRun } from "./handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const result = await handleAboutSupabaseSaveDryRun(req);
  const { status, ...body } = result;
  return new Response(JSON.stringify(body), {
    status: status ?? 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
