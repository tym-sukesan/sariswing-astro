/**
 * POST /api/admin/schedules/update.json — Update one schedule by legacy_id (Phase 3-P-B).
 * Authorization: Bearer <access_token> required. Admin only. No insert/delete/upsert.
 */
import type { APIRoute } from "astro";
import {
  adminApiErrorResponse,
  jsonResponse,
  requireAdminAuth,
} from "../../../../lib/admin-auth.ts";
import {
  parseScheduleUpdateRequest,
  updateScheduleByLegacyId,
} from "../../../../lib/admin-schedule-update.ts";

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

  const parsed = parseScheduleUpdateRequest(body);
  if (!parsed.ok) {
    return adminApiErrorResponse(parsed.error, 400);
  }

  const result = await updateScheduleByLegacyId(parsed.request.legacy_id, parsed.request.updates);
  if (!result.ok) {
    if (result.error === "not_found") {
      return adminApiErrorResponse("not_found", 404);
    }
    if (result.error === "home_featured_limit_exceeded") {
      return jsonResponse(
        {
          ok: false,
          error: result.error,
          message: result.message,
          limit: result.limit,
          current: result.current,
          moduleId: result.moduleId,
        },
        400,
      );
    }
    if (result.error === "validation_error") {
      return jsonResponse({ ok: false, error: result.error, message: result.message }, 400);
    }
    return adminApiErrorResponse("update_failed", 500);
  }

  return jsonResponse({
    ok: true,
    updated: true,
    legacy_id: result.record.legacy_id,
    record: result.record,
  });
};
