/**
 * G-6-e2 — Schedule dry-run form validation (client-side only).
 */

import type { ScheduleFormState, ScheduleValidationResult } from "./schedule-dry-run-types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalInt(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n)) return "invalid";
  return n;
}

export function validateScheduleForm(form: ScheduleFormState): ScheduleValidationResult {
  const errors: string[] = [];

  if (!form.date.trim()) {
    errors.push("date is required");
  } else if (!DATE_RE.test(form.date.trim())) {
    errors.push("date must be valid YYYY-MM-DD");
  } else {
    const parsed = Date.parse(`${form.date.trim()}T00:00:00`);
    if (Number.isNaN(parsed)) {
      errors.push("date must be a valid calendar date");
    }
  }

  const hasContent =
    form.title.trim().length > 0 ||
    form.venue.trim().length > 0 ||
    form.description.trim().length > 0;
  if (!hasContent) {
    errors.push("title, venue, or description must have content");
  }

  if (typeof form.published !== "boolean") {
    errors.push("published must be boolean");
  }
  if (typeof form.show_on_home !== "boolean") {
    errors.push("show_on_home must be boolean");
  }

  const homeOrder = parseOptionalInt(form.home_order);
  if (homeOrder === "invalid") {
    errors.push("home_order must be an integer or empty");
  }

  const sortOrder = parseOptionalInt(form.sort_order);
  if (sortOrder === "invalid") {
    errors.push("sort_order must be an integer or empty");
  }

  return { valid: errors.length === 0, errors };
}

export function deriveYearMonthFromDate(
  date: string,
): { year: number | null; month: string | null } {
  if (!DATE_RE.test(date)) {
    return { year: null, month: null };
  }
  const [y, m] = date.split("-");
  return {
    year: Number.parseInt(y, 10),
    month: `${y}-${m}`,
  };
}

export function formStateToWritePayload(
  form: ScheduleFormState,
): Record<string, unknown> {
  const homeOrder = form.home_order.trim();
  const sortOrder = form.sort_order.trim();
  return {
    date: form.date.trim(),
    title: form.title.trim() || null,
    venue: form.venue.trim() || null,
    open_time: form.open_time.trim() || null,
    start_time: form.start_time.trim() || null,
    price: form.price.trim() || null,
    description: form.description.trim() || null,
    published: form.published,
    show_on_home: form.show_on_home,
    home_order: homeOrder ? Number.parseInt(homeOrder, 10) : null,
    sort_order: sortOrder ? Number.parseInt(sortOrder, 10) : 0,
  };
}
