/**
 * CMS Core v2 — About / site_page_fields vertical slice contract (pure helpers).
 * No network / DB / secrets. Shared by verifier + build mapper + docs.
 *
 * Slice 1: page_key=about field_key=profile.lede only.
 * Contents About (G-12a) remains default Admin path + JSON build fallback.
 */

export const CMS_CORE_V2_ABOUT_PHASE =
  "cms-core-v2-about-supabase-vertical-slice-local-implementation";

export const GOSAKI_ABOUT_SITE_SLUG = "gosaki-piano";
export {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
} from "./supabase-staging-ref-utils.mjs";

export const ABOUT_SUPABASE_ENDPOINT_NAME = "gosaki-about-supabase-save-dry-run";
export const ABOUT_PAGE_KEY = "about";
export const ABOUT_FIELD_KEY_PROFILE_LEDE = "profile.lede";

export const ABOUT_SUPABASE_DRY_RUN_OPERATION = "dryRun";
export const ABOUT_SUPABASE_SAVE_OPERATION = "save";
export const ABOUT_SUPABASE_READ_OPERATION = "read";

export const ABOUT_SUPABASE_DRY_RUN_APPROVAL_ID =
  "G-cms-v2-about-supabase-profile-lede-dry-run";
export const ABOUT_SUPABASE_SAVE_APPROVAL_ID =
  "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice";

/** Client: opt into Supabase Admin path (live-read + dry-run). Contents remains default when unset. */
export const ABOUT_SUPABASE_PATH_ENABLED_ENV =
  "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED";
/** Client Save arm (exact "true"). Independent from Contents G-12a arm. */
export const ABOUT_SUPABASE_SAVE_UI_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED";
/** Server Save arm (Edge Deno env). Default disarmed. */
export const ABOUT_SUPABASE_SAVE_ARMED_ENV = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";
/** Build-time prefer DB read even when registry.sitePageFields=false. */
export const ABOUT_SITE_PAGE_FIELDS_BUILD_READ_ENV = "CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ";

export const SITE_PAGE_FIELDS_SELECT =
  "id,site_id,site_slug,page_key,field_key,value_text,published,sort_order,created_at,updated_at,created_by,updated_by";

/**
 * @param {Record<string, unknown>} row
 */
export function mapSitePageFieldRowToLedeDraft(row) {
  return {
    pageKey: String(row.page_key ?? ABOUT_PAGE_KEY),
    fieldKey: String(row.field_key ?? ABOUT_FIELD_KEY_PROFILE_LEDE),
    valueText: String(row.value_text ?? "").trim(),
    published: row.published === true,
    sortOrder: Number(row.sort_order ?? 0) || 0,
    rowId: row.id != null ? String(row.id) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  };
}

/**
 * Replace text content of the first <p>…</p> in profile HTML, preserving attributes.
 * @param {string} profileHtml
 * @param {string} ledeText
 */
export function overlayProfileLedeInHtml(profileHtml, ledeText) {
  const html = String(profileHtml ?? "");
  const next = String(ledeText ?? "").trim();
  if (!html || !next) return html;
  const escaped = next
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const replaced = html.replace(
    /(<p\b[^>]*>)([\s\S]*?)(<\/p>)/i,
    (_m, open, _inner, close) => `${open}${escaped}${close}`,
  );
  return replaced === html ? html : replaced;
}

/**
 * Extract first paragraph plain text from profile body (newline- or HTML-separated).
 * @param {string} body
 */
export function extractProfileLedeFromBody(body) {
  const raw = String(body ?? "").trim();
  if (!raw) return "";
  if (raw.includes("<p")) {
    const m = raw.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (m) {
      return m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
  }
  return raw.split(/\n\s*\n/)[0]?.trim() || raw.split("\n")[0]?.trim() || raw;
}

/**
 * @param {{ valueText: string, updatedAt?: string|null, published?: boolean, sortOrder?: number }} draft
 */
export function buildAboutSupabaseFingerprint(draft) {
  return JSON.stringify({
    pageKey: ABOUT_PAGE_KEY,
    fieldKey: ABOUT_FIELD_KEY_PROFILE_LEDE,
    valueText: String(draft.valueText ?? "").trim(),
    published: draft.published === true,
    sortOrder: Number(draft.sortOrder) || 0,
    updatedAt: draft.updatedAt ?? null,
  });
}

/**
 * Pure dry-run plan for profile.lede (no write).
 * @param {{
 *   before: { valueText: string, updatedAt?: string|null, published?: boolean, sortOrder?: number },
 *   after: { valueText: string, published?: boolean, sortOrder?: number },
 * }} input
 */
export function planAboutProfileLedeDryRun(input) {
  const errors = [];
  const warnings = [];
  const before = input.before ?? { valueText: "" };
  const after = input.after ?? { valueText: "" };
  const nextValue = String(after.valueText ?? "").trim();
  if (!nextValue) errors.push("value_text must be non-empty");
  if (nextValue.includes("<") || nextValue.includes(">")) {
    warnings.push("value_text looks like HTML — slice expects plain text");
  }
  const changed =
    nextValue !== String(before.valueText ?? "").trim() ||
    (after.published !== undefined && after.published !== before.published) ||
    (after.sortOrder !== undefined &&
      Number(after.sortOrder) !== Number(before.sortOrder ?? 0));

  return {
    ok: errors.length === 0,
    dryRun: true,
    pageKey: ABOUT_PAGE_KEY,
    fieldKey: ABOUT_FIELD_KEY_PROFILE_LEDE,
    before: {
      valueText: String(before.valueText ?? "").trim(),
      updatedAt: before.updatedAt ?? null,
      published: before.published === true,
      sortOrder: Number(before.sortOrder ?? 0) || 0,
    },
    after: {
      valueText: nextValue,
      published: after.published === undefined ? true : after.published === true,
      sortOrder: Number(after.sortOrder ?? before.sortOrder ?? 10) || 10,
    },
    changedFields: changed ? ["value_text"] : [],
    noChange: !changed,
    errors,
    warnings,
    expectedBeforeUpdatedAt: before.updatedAt ?? null,
    fingerprint: buildAboutSupabaseFingerprint({
      valueText: nextValue,
      updatedAt: before.updatedAt ?? null,
      published: after.published === undefined ? true : after.published === true,
      sortOrder: Number(after.sortOrder ?? before.sortOrder ?? 10) || 10,
    }),
  };
}
