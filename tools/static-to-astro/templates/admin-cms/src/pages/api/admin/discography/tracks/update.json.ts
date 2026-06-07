/**
 * POST /api/admin/discography/tracks/update.json — Update existing tracks (Phase 3-P-G).
 * Authorization: Bearer <access_token> required. Admin only. No insert/delete/upsert.
 */
import type { APIRoute } from "astro";
import {
  adminApiErrorResponse,
  jsonResponse,
  requireAdminAuth,
} from "../../../../../lib/admin-auth.ts";
import {
  parseDiscographyTracksUpdateRequest,
  updateDiscographyTracksByLegacyId,
} from "../../../../../lib/admin-discography-tracks-update.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) {
    return adminApiErrorResponse(auth.error, auth.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminApiErrorResponse("validation_error", 400);
  }

  const parsed = parseDiscographyTracksUpdateRequest(body);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: parsed.error, message: parsed.message }, 400);
  }

  const result = await updateDiscographyTracksByLegacyId(
    parsed.request.discography_legacy_id,
    parsed.request.tracks,
  );

  if (!result.ok) {
    if (result.error === "not_found") {
      return adminApiErrorResponse("not_found", 404);
    }
    if (result.error === "validation_error") {
      return jsonResponse({ ok: false, error: result.error, message: result.message }, 400);
    }
    return adminApiErrorResponse("update_failed", 500);
  }

  return jsonResponse({
    ok: true,
    updated: true,
    discography_legacy_id: result.discography_legacy_id,
    updated_count: result.updated_count,
    tracks: result.tracks,
  });
};
