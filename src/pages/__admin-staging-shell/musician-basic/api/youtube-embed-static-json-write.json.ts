/**
 * POST /__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json
 * G-10c — Gosaki YouTube embed static JSON write (staging shell only).
 */
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { executeG10cYoutubeEmbedStaticJsonWrite } from "../../../../lib/admin/staging-write/gosaki-youtube-embed-static-json-write-executor";
import { getG10cYoutubeEmbedStaticJsonWriteConfig } from "../../../../lib/admin/staging-write/gosaki-youtube-embed-static-json-write-config";
import {
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
} from "../../../../lib/admin/staging-write/gosaki-youtube-embed-static-json-write-types";

export const prerender = false;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function requireStagingBearerAuth(
  request: Request,
  env: ImportMetaEnv,
): Promise<{ ok: true; email: string } | { ok: false; status: number; errorCode: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, errorCode: "missing_auth" };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const url = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    return { ok: false, status: 503, errorCode: "supabase_not_configured" };
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email) {
    return { ok: false, status: 401, errorCode: "invalid_auth" };
  }

  return { ok: true, email: data.user.email };
}

async function handlePost(request: Request): Promise<Response> {
  const env = import.meta.env;
  const writeConfig = getG10cYoutubeEmbedStaticJsonWriteConfig(env);

  if (!writeConfig.saveEnabled) {
    return jsonResponse(
      {
        ok: false,
        errorCode: "save_not_enabled",
        errorMessage:
          writeConfig.armFailureReason ??
          "G-10c Save path disabled on server — env arm / approval stack not satisfied.",
      },
      403,
    );
  }

  const auth = await requireStagingBearerAuth(request, env);
  if (!auth.ok) {
    return jsonResponse(
      { ok: false, errorCode: auth.errorCode, errorMessage: auth.errorCode },
      auth.status,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { ok: false, errorCode: "invalid_json", errorMessage: "Request body is not valid JSON." },
      400,
    );
  }

  if (!body || typeof body !== "object") {
    return jsonResponse(
      { ok: false, errorCode: "invalid_body", errorMessage: "Request body must be a JSON object." },
      400,
    );
  }

  const record = body as Record<string, unknown>;
  const approvalId = String(record.approvalId ?? "").trim();
  const itemId = String(record.itemId ?? "").trim();
  const embedCode = String(record.embedCode ?? "");
  const published = record.published === true;
  const changedFields = Array.isArray(record.changedFields)
    ? record.changedFields.map((field) => String(field))
    : [];
  const payloadKeys = Array.isArray(record.payloadKeys)
    ? record.payloadKeys.map((key) => String(key))
    : [];
  const dryRunOk = record.dryRunOk === true;

  if (approvalId !== G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID) {
    return jsonResponse(
      { ok: false, errorCode: "approval_mismatch", errorMessage: "approvalId mismatch." },
      400,
    );
  }
  if (itemId !== G10C_YOUTUBE_EMBED_TARGET_ITEM_ID) {
    return jsonResponse(
      { ok: false, errorCode: "item_mismatch", errorMessage: "itemId mismatch." },
      400,
    );
  }

  const outcome = executeG10cYoutubeEmbedStaticJsonWrite({
    cwd: process.cwd(),
    itemId,
    approvalId,
    formValues: { embedCode, published },
    changedFields,
    payloadKeys,
    dryRunOk,
    signedIn: true,
    env,
  });

  if (!outcome.ok) {
    return jsonResponse(
      {
        ok: false,
        errorCode: outcome.errorCode ?? "write_failed",
        errorMessage: outcome.errorMessage,
      },
      400,
    );
  }

  return jsonResponse({
    ok: true,
    itemsAffected: outcome.itemsAffected,
    changedFields: outcome.changedFields,
    configPath: outcome.configPath,
    itemId: outcome.itemId,
  });
}

export const GET: APIRoute = async () =>
  jsonResponse(
    {
      ok: false,
      error: "method_not_allowed",
      errorCode: "method_not_allowed",
      errorMessage: "POST only. Use Save from YouTube admin UI.",
    },
    405,
  );

export const POST: APIRoute = async ({ request }) => handlePost(request);

export const ALL: APIRoute = async ({ request }) => {
  if (request.method === "POST") {
    return handlePost(request);
  }
  return jsonResponse(
    {
      ok: false,
      error: "method_not_allowed",
      errorCode: "method_not_allowed",
      errorMessage: `Method ${request.method} not allowed. POST only.`,
    },
    405,
  );
};
