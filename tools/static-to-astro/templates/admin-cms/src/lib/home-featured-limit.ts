/**
 * Home featured item limits (Phase 3-P-E).
 *
 * Generic "featured on home" concept — today schedules.show_on_home only.
 * Future modules: news.featured_on_home, events.show_on_home, works.featured_on_home, etc.
 */

export const HOME_FEATURED_LIMIT = 3;

/** Module config for schedules home featured slot. */
export const SCHEDULES_HOME_FEATURED_MODULE = {
  moduleId: "schedules.show_on_home",
  table: "schedules",
  featuredField: "show_on_home",
  publishedField: "published",
  limit: HOME_FEATURED_LIMIT,
} as const;

export type HomeFeaturedModuleId = typeof SCHEDULES_HOME_FEATURED_MODULE.moduleId;

export interface HomeFeaturedLimitExceededPayload {
  ok: false;
  error: "home_featured_limit_exceeded";
  message: string;
  limit: number;
  current: number;
  moduleId: HomeFeaturedModuleId;
}

export function homeFeaturedLimitExceededResponse(
  current: number,
  moduleId: HomeFeaturedModuleId = SCHEDULES_HOME_FEATURED_MODULE.moduleId,
): HomeFeaturedLimitExceededPayload {
  return {
    ok: false,
    error: "home_featured_limit_exceeded",
    message: "Home featured schedules are limited to 3 items.",
    limit: HOME_FEATURED_LIMIT,
    current,
    moduleId,
  };
}
