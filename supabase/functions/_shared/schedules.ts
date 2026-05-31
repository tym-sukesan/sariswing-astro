export const SCHEDULE_TIME_TYPE_OPTIONS = ["昼", "夜", "その他"] as const;

export const SCHEDULE_SELECT = "*";

export type VenueRecord = {
  name: string;
  id?: string | number;
  [key: string]: unknown;
};

export type ScheduleRecord = {
  id?: string | number;
  date: string;
  time_type?: string | null;
  title?: string | null;
  venue_name?: string | null;
  venue_id?: number | null;
  genre?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  members?: string | null;
  reservation_url?: string | null;
  note?: string | null;
  image_url?: string | null;
  is_published?: boolean | null;
  is_special?: boolean | null;
};

export type ScheduleWritePayload = {
  date: string;
  time_type: string | null;
  venue_id: number | null;
  venue_name: string | null;
  title: string | null;
  genre: string | null;
  open_time: string | null;
  start_time: string | null;
  price: string | null;
  members: string | null;
  reservation_url: string | null;
  note: string | null;
  image_url: string | null;
  is_published: boolean;
  is_special: boolean;
};

export function parseRowId(id: string): string | number {
  if (/^\d+$/.test(id)) {
    const numeric = Number(id);
    if (Number.isSafeInteger(numeric)) return numeric;
  }
  return id;
}
