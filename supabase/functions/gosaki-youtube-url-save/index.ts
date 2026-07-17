/**
 * G-11c6 — Gosaki YouTube URL web-save (GitHub Contents commit · staging only).
 * No workflow_dispatch from this function.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, requireAdminUser } from "../_shared/admin-auth.ts";
import { handleG11c6YoutubeUrlSaveBody } from "../_shared/gosaki-youtube-url-save.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminResult = await requireAdminUser(req);
  if (adminResult instanceof Response) return adminResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const result = await handleG11c6YoutubeUrlSaveBody(body);
  const status = typeof result.httpStatus === "number" ? result.httpStatus : result.ok ? 200 : 400;
  const { httpStatus: _drop, ...payload } = result as Record<string, unknown>;
  return jsonResponse(payload, status);
});
