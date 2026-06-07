/**
 * GET /api/admin/me.json — Admin auth status (Phase 3-P-A).
 * Authorization: Bearer <access_token>
 * No CMS writes. No tokens/keys in response.
 */
import type { APIRoute } from "astro";
import { adminMeJsonResponse, getBearerToken, resolveAdminMe } from "../../../lib/admin-auth.ts";

/** Must be dynamic — auth depends on Authorization header (Phase 3-P-A). */
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token = getBearerToken(request);
  const result = await resolveAdminMe(token);
  const status = result.ok ? 200 : 500;
  return adminMeJsonResponse(result, status);
};
