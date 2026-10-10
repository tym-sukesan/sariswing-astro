export const GOSAKI_HOME_LATEST_SCHEDULE_LIMIT = 4;

export type GosakiHomeScheduleRow = {
  published?: boolean;
  date?: string | null;
  date_display?: string | null;
  dateDisplay?: string | null;
  dateStatus?: string | null;
  date_status?: string | null;
  title?: string | null;
  venue?: string | null;
  sort_order?: number | null;
  monthMembership?: { kind?: string } | null;
};

function isIsoDate(date: unknown): date is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
}

/** Calendar date in Asia/Tokyo (JST), YYYY-MM-DD. */
export function gosakiHomeScheduleTodayJst(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function byDateAsc(a: GosakiHomeScheduleRow, b: GosakiHomeScheduleRow): number {
  const d = String(a.date || "").localeCompare(String(b.date || ""));
  if (d !== 0) return d;
  return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
}

/** Upcoming published first (date >= today). If none, most recent past. */
export function selectGosakiHomeLatestSchedules(
  schedules: GosakiHomeScheduleRow[] | unknown,
  options: { limit?: number; today?: string } = {},
): GosakiHomeScheduleRow[] {
  const limit = options.limit ?? GOSAKI_HOME_LATEST_SCHEDULE_LIMIT;
  const today = options.today ?? gosakiHomeScheduleTodayJst();
  const rows = (Array.isArray(schedules) ? schedules : []).filter((row) => {
    const s = (row ?? {}) as GosakiHomeScheduleRow;
    if (s.published !== true) return false;
    if (s.monthMembership?.kind === "hub-only") return false;
    const status = s.dateStatus ?? s.date_status;
    if (status === "tbd") return false;
    return isIsoDate(s.date);
  }) as GosakiHomeScheduleRow[];

  const upcoming = rows.filter((s) => String(s.date) >= today).sort(byDateAsc);
  if (upcoming.length > 0) return upcoming.slice(0, limit);
  return rows.sort((a, b) => byDateAsc(b, a)).slice(0, limit);
}

export function gosakiHomeScheduleTitle(title: unknown): string {
  const t = String(title || "").trim();
  if (!t || t === "<>") return "";
  return t;
}

export function gosakiHomeScheduleDateLabel(row: GosakiHomeScheduleRow): string {
  return String(row.date_display || row.dateDisplay || row.date || "").trim();
}

/** Month page path for a published ISO date. Null when not YYYY-MM-DD. */
export function gosakiHomeScheduleMonthPath(date: unknown): string | null {
  const raw = String(date || "");
  if (!isIsoDate(raw)) return null;
  return `/schedule/${raw.slice(0, 7)}/`;
}

type GosakiScheduleIdentity = {
  legacy_id?: string | null;
  legacyId?: string | null;
  id?: string | null;
  date?: string | null;
};

/** Stable fragment id. legacy_id first; DB id only when legacy_id is absent. */
export function gosakiScheduleEventAnchorId(row: GosakiScheduleIdentity | null | undefined): string | null {
  const legacy = String(row?.legacy_id || row?.legacyId || "").trim();
  if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(legacy)) return legacy;
  const id = String(row?.id || "").trim();
  if (/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) return `event-${id}`;
  return null;
}

/** Month path plus the event fragment. Date is never the anchor. */
export function gosakiHomeScheduleItemPath(row: GosakiScheduleIdentity | null | undefined): string | null {
  const month = gosakiHomeScheduleMonthPath(row?.date);
  if (!month) return null;
  const anchor = gosakiScheduleEventAnchorId(row);
  return anchor ? `${month}#${anchor}` : month;
}

/** http(s) flyer only. Empty and other schemes render nothing. */
export function gosakiScheduleImageUrl(url: unknown): string | null {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return raw;
  } catch {
    return null;
  }
}
