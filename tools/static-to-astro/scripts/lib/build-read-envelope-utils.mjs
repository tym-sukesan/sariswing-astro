/**
 * CMS Core — build-read result envelope skeleton (Node).
 * Site-agnostic assembly for YouTube embeds / About page_fields (and future loaders).
 *
 * Owns: immutable object assembly · safe rowCount · shallow feature extras.
 * Does NOT own: fetch · env · registry · production gate · reason codes · row validation · logging.
 *
 * Feature-specific dataSource / rows key names stay caller-owned (no forced rename).
 */

/**
 * @param {unknown} rows
 * @returns {number}
 */
export function buildReadRowCount(rows) {
  return Array.isArray(rows) ? rows.length : 0;
}

/**
 * @param {{
 *   dataSourceKey: string,
 *   dataSource: string,
 *   fallbackReason: string | null,
 *   rowsKey: string,
 *   rows: unknown,
 *   siteSlug: string,
 *   rowCount?: number,
 *   extra?: Record<string, unknown>,
 * }} input
 * @returns {Record<string, unknown>}
 */
export function createBuildReadEnvelope(input) {
  const rows = input.rows;
  const rowCount =
    input.rowCount !== undefined ? input.rowCount : buildReadRowCount(rows);
  /** @type {Record<string, unknown>} */
  const out = {
    [input.dataSourceKey]: input.dataSource,
    fallbackReason: input.fallbackReason,
    [input.rowsKey]: rows,
    siteSlug: input.siteSlug,
    rowCount,
  };
  const extra = input.extra;
  if (extra && typeof extra === "object") {
    Object.assign(out, extra);
  }
  return out;
}

/**
 * Success path: `fallbackReason` forced to null.
 * @param {{
 *   dataSourceKey: string,
 *   dataSource?: string,
 *   rowsKey: string,
 *   rows: unknown,
 *   siteSlug: string,
 *   rowCount?: number,
 *   extra?: Record<string, unknown>,
 * }} input
 */
export function createBuildReadSuccessEnvelope(input) {
  return createBuildReadEnvelope({
    dataSourceKey: input.dataSourceKey,
    dataSource: input.dataSource ?? "supabase",
    fallbackReason: null,
    rowsKey: input.rowsKey,
    rows: input.rows,
    siteSlug: input.siteSlug,
    rowCount: input.rowCount,
    extra: input.extra,
  });
}

/**
 * Fallback / empty / blocked / error path.
 * @param {{
 *   dataSourceKey: string,
 *   dataSource: string,
 *   fallbackReason: string | null,
 *   rowsKey: string,
 *   rows?: unknown,
 *   siteSlug: string,
 *   rowCount?: number,
 *   extra?: Record<string, unknown>,
 * }} input
 */
export function createBuildReadFallbackEnvelope(input) {
  return createBuildReadEnvelope({
    dataSourceKey: input.dataSourceKey,
    dataSource: input.dataSource,
    fallbackReason: input.fallbackReason,
    rowsKey: input.rowsKey,
    rows: input.rows !== undefined ? input.rows : [],
    siteSlug: input.siteSlug,
    rowCount: input.rowCount,
    extra: input.extra,
  });
}
