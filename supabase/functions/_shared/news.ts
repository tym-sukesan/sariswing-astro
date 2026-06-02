export const NEWS_SELECT =
  "id, date, title, slug, url, excerpt, content, image_url, category, is_published, deleted_at";

export type NewsRecord = {
  id: string | number;
  date: string;
  title: string;
  slug?: string | null;
  url?: string | null;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;
  category?: string | null;
  is_published: boolean;
  deleted_at?: string | null;
};

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

export function slugifyTitle(title: string): string | null {
  const ascii = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || null;
}

export function generateSlug(
  title: string,
  date: string,
  explicitSlug: string | null | undefined
): string {
  if (explicitSlug?.trim()) return explicitSlug.trim();
  const fromTitle = slugifyTitle(title);
  if (fromTitle) return fromTitle;
  const normalized = (date || "").replace(/\./g, "-");
  const datePart = normalized.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return `news-${datePart || String(Date.now())}`;
}

export function parseRowId(id: string): string | number {
  if (/^\d+$/.test(id)) {
    const numeric = Number(id);
    if (Number.isSafeInteger(numeric)) return numeric;
  }
  return id;
}
