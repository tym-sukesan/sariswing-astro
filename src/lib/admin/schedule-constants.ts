export const SCHEDULE_TIME_TYPE_OPTIONS = ["昼", "夜", "その他"] as const;

export type VenueOption = { name: string };

export type ScheduleAdminRecord = {
  id?: string | number | null;
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
  image_urls?: string[] | null;
  is_published?: boolean | null;
  is_special?: boolean | null;
  deleted_at?: string | null;
};
