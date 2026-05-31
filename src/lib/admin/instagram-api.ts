import type { InstagramPostRecord } from "../instagram-posts";
import { invokeAdminEdgeFunction } from "./invoke-admin-edge";

type ListResponse = {
  ok?: boolean;
  data?: InstagramPostRecord[];
  error?: string;
};

type MutateResponse = {
  ok?: boolean;
  error?: string;
  sort_order?: number;
  count?: number;
};

export async function listInstagramPosts(): Promise<InstagramPostRecord[]> {
  const result = await invokeAdminEdgeFunction<ListResponse>("admin-instagram", {
    action: "list",
  });
  return result.data ?? [];
}

export async function createInstagramPost(embed_code: string) {
  return invokeAdminEdgeFunction<MutateResponse & { sort_order?: number }>("admin-instagram", {
    action: "create",
    embed_code,
  });
}

export async function updateInstagramEmbed(id: string, embed_code: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-instagram", {
    action: "update_embed",
    id,
    embed_code,
  });
}

export async function updateInstagramSortOrders(
  updates: { id: string; sort_order: number }[]
) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-instagram", {
    action: "update_sort_orders",
    updates,
  });
}

export async function deleteInstagramPost(id: string) {
  return invokeAdminEdgeFunction<MutateResponse>("admin-instagram", {
    action: "delete",
    id,
  });
}
