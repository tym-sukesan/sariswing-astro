/**
 * Prefix site-root paths with Astro deploy base (staging subdirectory).
 */
export function withBase(route: string): string {
  const base = import.meta.env.BASE_URL;
  if (!route || route === "/") return base;
  if (/^https?:\/\//i.test(route)) {
    return route;
  }
  const rel = route.startsWith("/") ? route.slice(1) : route;
  return `${base}${rel}`;
}
