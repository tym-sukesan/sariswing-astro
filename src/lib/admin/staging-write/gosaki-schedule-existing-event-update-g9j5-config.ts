/**
 * G-9j5 — Fixed one-row description UPDATE constants (staging shell only).
 */

export const G9J5_PHASE =
  "G-9j5-gosaki-schedule-existing-event-update-one-row-non-dry-run";

export const G9J5_TARGET_ROW_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";

export const G9J5_TARGET_LEGACY_ID = "schedule-2026-03-007";

export const G9J5_TARGET_SITE_SLUG = "gosaki-piano";

export const G9J5_EXPECTED_BEFORE_UPDATED_AT =
  "2026-06-16T16:03:41.551792+00:00";

export const G9J5_DESCRIPTION_BEFORE =
  "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/";

export const G9J5_DESCRIPTION_PLANNED_AFTER =
  "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/\n（管理画面保存テスト）";

export const G9J5_CHANGED_FIELDS = ["description"] as const;

export function buildG9j5DescriptionPayload(): { description: string } {
  return { description: G9J5_DESCRIPTION_PLANNED_AFTER };
}
