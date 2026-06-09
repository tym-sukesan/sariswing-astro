import { withBase } from "./with-base.ts";

const PLACEHOLDER_HOSTS = new Set(["example.supabase.co"]);

/**
 * Returns true for missing URLs and staging placeholder hosts (e.g. example.supabase.co).
 */
export function isPlaceholderImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  if (url.includes("example.supabase.co")) return true;
  try {
    return PLACEHOLDER_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Resolves a public image URL for static deploy:
 * - null for placeholders → component shows flyer/cover placeholder
 * - absolute https URLs unchanged
 * - root-relative paths prefixed with deploy base
 */
export function resolvePublicImageUrl(url: string | null | undefined): string | null {
  if (isPlaceholderImageUrl(url)) return null;
  if (url!.startsWith("http://") || url!.startsWith("https://")) return url!;
  if (url!.startsWith("/")) return withBase(url!);
  return url!;
}
