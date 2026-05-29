export type InstagramPostRecord = {
  id: string | number;
  embed_code?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

/** 表示順: sort_order 昇順 → 未設定は created_at 降順（将来 D&D でも同じ比較を再利用） */
export function compareInstagramPosts(
  a: InstagramPostRecord,
  b: InstagramPostRecord
): number {
  const aOrder = a.sort_order;
  const bOrder = b.sort_order;
  const aHas = aOrder != null && Number.isFinite(aOrder);
  const bHas = bOrder != null && Number.isFinite(bOrder);

  if (aHas && bHas) return aOrder - bOrder;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;

  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bTime - aTime;
}

export function sortInstagramPosts<T extends InstagramPostRecord>(posts: T[]): T[] {
  return [...posts].sort(compareInstagramPosts);
}

/** 新規追加を先頭にする sort_order（既存の最小値より 10 小さい） */
export function nextSortOrderForNewPost(posts: Pick<InstagramPostRecord, "sort_order">[]): number {
  const orders = posts
    .map((p) => p.sort_order)
    .filter((n): n is number => n != null && Number.isFinite(n));

  if (orders.length === 0) return 10;
  return Math.min(...orders) - 10;
}
