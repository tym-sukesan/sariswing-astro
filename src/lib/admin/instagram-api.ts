import type { InstagramPostRecord } from "../instagram-posts";
import { supabaseAdmin } from "../supabase-admin";

type ApiErrorBody = {
  error?: string;
  detail?: string;
};

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

async function invokeAdminInstagram<T extends ApiErrorBody>(
  body: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();

  if (!session) {
    throw new Error("ログインが必要です。再度ログインしてください。");
  }

  const { data, error } = await supabaseAdmin.functions.invoke("admin-instagram", {
    body,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as T | null;
  if (!payload) {
    throw new Error("Empty response from admin-instagram");
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

export async function listInstagramPosts(): Promise<InstagramPostRecord[]> {
  const result = await invokeAdminInstagram<ListResponse>({ action: "list" });
  return result.data ?? [];
}

export async function createInstagramPost(embed_code: string) {
  return invokeAdminInstagram<MutateResponse & { sort_order?: number }>({
    action: "create",
    embed_code,
  });
}

export async function updateInstagramEmbed(id: string, embed_code: string) {
  return invokeAdminInstagram<MutateResponse>({
    action: "update_embed",
    id,
    embed_code,
  });
}

export async function updateInstagramSortOrders(
  updates: { id: string; sort_order: number }[]
) {
  return invokeAdminInstagram<MutateResponse>({
    action: "update_sort_orders",
    updates,
  });
}

export async function deleteInstagramPost(id: string) {
  return invokeAdminInstagram<MutateResponse>({ action: "delete", id });
}
