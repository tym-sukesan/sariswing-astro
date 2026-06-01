const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatScheduleDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

export function getTimeTypeSymbol(timeType: string | null | undefined) {
  if (!timeType) return "";

  const normalized = timeType.trim().toLowerCase();

  if (timeType === "昼" || normalized === "day") return "☀";
  if (timeType === "夜" || normalized === "night") return "☽";

  return "";
}

export function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  return `${Number(month)}月 LIVE SCHEDULE ${year}`;
}

export function sortSchedules<T extends { date: string; start_time?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.start_time || "").localeCompare(b.start_time || "");
  });
}

export function isImageUrl(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function groupSchedulesByMonth<T extends { date?: string | null }>(schedules: T[] | null) {
  const byMonth = new Map<string, T[]>();

  for (const item of schedules ?? []) {
    const month = item.date?.slice(0, 7);
    if (!month) continue;

    const current = byMonth.get(month) ?? [];
    current.push(item);
    byMonth.set(month, current);
  }

  return byMonth;
}

/** 公開済みスケジュールの date から YYYY-MM 一覧（新しい月順） */
export function getPublishedMonthsFromSchedules(
  schedules: { date?: string | null }[] | null | undefined
): string[] {
  const months = new Set<string>();

  for (const item of schedules ?? []) {
    const month = item.date?.slice(0, 7);
    if (month) months.add(month);
  }

  return [...months].sort((a, b) => b.localeCompare(a));
}

export function getLiveScheduleMonthPath(month: string) {
  return `/schedule/${month}/`;
}
