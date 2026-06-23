/**
 * POST /__admin-staging-shell/musician-basic/api/about-profile-html-static-json-write.json
 * G-10h4a — Gosaki About profile HTML static JSON write dry-run (staging shell only).
 */
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { getG10h4aAboutProfileHtmlStaticJsonWriteConfig } from "../../../../lib/admin/staging-write/gosaki-about-profile-html-static-json-write-config";
import { executeG10h4aAboutProfileHtmlStaticJsonWriteDryRun } from "../../../../lib/admin/staging-write/gosaki-about-profile-html-static-json-write-dry-run";
import { executeG10h4bAboutProfileHtmlStaticJsonWrite } from "../../../../lib/admin/staging-write/gosaki-about-profile-html-static-json-write-executor";
import {
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_SITE_SLUG,
  G10H4A_TARGET_BLOCK_ID,
} from "../../../../lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types";

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

function isStagingAuthRequired(env: ImportMetaEnv): boolean {
  return (
    env.ENABLE_ADMIN_STAGING_AUTH === "true" ||
    env.PUBLIC_ENABLE_ADMIN_STAGING_AUTH === "true"
  );
}

async function handlePost(request: Request): Promise<Response> {
  const env = import.meta.env;
  const writeConfig = getG10h4aAboutProfileHtmlStaticJsonWriteConfig(env);

  if (!writeConfig.dev || !writeConfig.stagingShellEnabled) {
    return jsonResponse(
      {
        ok: false,
        errorCode: "staging_shell_disabled",
        errorMessage: "About profile HTML write API is disabled outside staging shell dev.",
      },
      403,
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
  const siteSlug = String(record.siteSlug ?? "").trim();
  const blockId = String(record.blockId ?? "").trim();
  const html = String(record.html ?? "");
  const dryRun = record.dryRun === true;
  const dryRunOk = record.dryRunOk === true;
  const changedFields = Array.isArray(record.changedFields)
    ? record.changedFields.map((field) => String(field))
    : [];

  if (!dryRun) {
    if (!writeConfig.saveEnabled) {
      return jsonResponse(
        {
          ok: false,
          errorCode: "save_not_enabled",
          errorMessage:
            "non-dry-run Save rejected — G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED is false.",
          dryRun: false,
          wouldWrite: false,
        },
        403,
      );
    }

    if (isStagingAuthRequired(env)) {
      const auth = await requireStagingBearerAuth(request, env);
      if (!auth.ok) {
        return jsonResponse(
          { ok: false, errorCode: auth.errorCode, errorMessage: auth.errorCode },
          auth.status,
        );
      }
    }

    const outcome = executeG10h4bAboutProfileHtmlStaticJsonWrite({
      cwd: process.cwd(),
      approvalId,
      siteSlug,
      blockId,
      formValues: { html },
      changedFields,
      dryRunOk,
      signedIn: true,
      env,
    });

    if (!outcome.ok) {
      return jsonResponse(
        {
          ok: false,
          dryRun: false,
          wouldWrite: false,
          errorCode: outcome.errorCode ?? "write_failed",
          errorMessage: outcome.errorMessage,
          changedFields: outcome.changedFields,
          blocksAffected: outcome.blocksAffected,
        },
        400,
      );
    }

    return jsonResponse({
      ok: true,
      dryRun: false,
      wouldWrite: true,
      approvalId: outcome.approvalId,
      blockId: outcome.blockId,
      configPath: outcome.configPath,
      changedFields: outcome.changedFields,
      blocksAffected: outcome.blocksAffected,
    });
  }

  if (isStagingAuthRequired(env)) {
    const auth = await requireStagingBearerAuth(request, env);
    if (!auth.ok) {
      return jsonResponse(
        { ok: false, errorCode: auth.errorCode, errorMessage: auth.errorCode },
        auth.status,
      );
    }
  }

  const result = executeG10h4aAboutProfileHtmlStaticJsonWriteDryRun({
    cwd: process.cwd(),
    approvalId,
    siteSlug,
    blockId,
    formValues: { html },
    signedIn: true,
    env,
  });

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        dryRun: true,
        wouldWrite: false,
        approvalId: result.approvalId,
        siteSlug: result.siteSlug,
        blockId: result.blockId,
        targetPath: result.targetPath,
        changedFields: result.changedFields,
        oldLength: result.oldLength,
        newLength: result.newLength,
        lengthDelta: result.lengthDelta,
        blocksAffected: result.blocksAffected,
        htmlSafety: result.htmlSafety,
        guardErrors: result.guardErrors,
        saveAllowed: result.saveAllowed,
        saveReadiness: result.saveReadiness,
        errorCode: "dry_run_guard_error",
        errorMessage: result.guardErrors.join(" ") || "dry-run guard error",
      },
      400,
    );
  }

  return jsonResponse({
    ok: true,
    dryRun: true,
    wouldWrite: false,
    approvalId: result.approvalId,
    siteSlug: result.siteSlug,
    blockId: result.blockId,
    targetPath: result.targetPath,
    changedFields: result.changedFields,
    oldLength: result.oldLength,
    newLength: result.newLength,
    lengthDelta: result.lengthDelta,
    blocksAffected: result.blocksAffected,
    htmlSafety: result.htmlSafety,
    guardErrors: result.guardErrors,
    saveAllowed: result.saveAllowed,
    saveReadiness: result.saveReadiness,
  });
}

export const GET: APIRoute = async () =>
  jsonResponse(
    {
      ok: false,
      error: "method_not_allowed",
      errorCode: "method_not_allowed",
      errorMessage: "POST only. Use dry-run from About admin UI.",
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
