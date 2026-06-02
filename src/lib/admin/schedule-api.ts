import type { ScheduleAdminRecord, VenueOption } from "./schedule-constants";
import { invokeAdminEdgeFunction } from "./invoke-admin-edge";

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
  image_urls: string[] | null;
  is_published: boolean;
  is_special: boolean;
};

type ListData = {
  schedules: ScheduleAdminRecord[];
  venues: VenueOption[];
};

type ListResponse = {
  ok?: boolean;
  data?: ListData;
  error?: string;
};

type DeletedListResponse = {
  ok?: boolean;
  data?: ScheduleAdminRecord[];
  error?: string;
};

type MutateResponse = {
  ok?: boolean;
  data?: ScheduleAdminRecord;
  error?: string;
  count?: number;
};

export async function listScheduleAdminData(): Promise<ListData> {
  const result = await invokeAdminEdgeFunction<ListResponse>("admin-schedule", {
    action: "list",
  });
  return {
    schedules: result.data?.schedules ?? [],
    venues: result.data?.venues ?? [],
  };
}

export async function listDeletedSchedules(): Promise<ScheduleAdminRecord[]> {
  const result = await invokeAdminEdgeFunction<DeletedListResponse>("admin-schedule", {
    action: "list_deleted",
  });
  return result.data ?? [];
}

export async function createSchedule(record: ScheduleWritePayload) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-schedule", {
    action: "create",
    record,
  });
}

export async function updateSchedule(id: string, record: ScheduleWritePayload) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-schedule", {
    action: "update",
    id,
    record,
  });
}

export async function duplicateSchedule(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-schedule", {
    action: "duplicate",
    id,
  });
}

export async function deleteSchedule(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-schedule", {
    action: "delete",
    id,
  });
}

export async function restoreSchedule(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-schedule", {
    action: "restore",
    id,
  });
}
