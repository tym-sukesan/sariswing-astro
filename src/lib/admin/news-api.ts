import type { NewsRecord } from "../news";
import { invokeAdminEdgeFunction } from "./invoke-admin-edge";

export type NewsWritePayload = {
  date: string;
  title: string;
  slug?: string | null;
  url?: string | null;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;
  category?: string | null;
  is_published: boolean;
};

type ListResponse = {
  ok?: boolean;
  data?: NewsRecord[];
  error?: string;
};

type MutateResponse = {
  ok?: boolean;
  data?: NewsRecord;
  error?: string;
  count?: number;
};

export async function listNews(): Promise<NewsRecord[]> {
  const result = await invokeAdminEdgeFunction<ListResponse>("admin-news", {
    action: "list",
  });
  return result.data ?? [];
}

export async function listDeletedNews(): Promise<NewsRecord[]> {
  const result = await invokeAdminEdgeFunction<ListResponse>("admin-news", {
    action: "list_deleted",
  });
  return result.data ?? [];
}

export async function createNews(record: NewsWritePayload) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-news", {
    action: "create",
    record,
  });
}

export async function updateNews(id: string, record: NewsWritePayload) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-news", {
    action: "update",
    id,
    record,
  });
}

export async function duplicateNews(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-news", {
    action: "duplicate",
    id,
  });
}

export async function deleteNews(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-news", {
    action: "delete",
    id,
  });
}

export async function restoreNews(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-news", {
    action: "restore",
    id,
  });
}
