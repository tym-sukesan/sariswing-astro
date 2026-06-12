/**
 * G-6-e2/e3 — Schedule dry-run form validation (client-side only).
 */

import type {
  ScheduleDryRunFormInput,
  ScheduleDryRunValidation,
  ScheduleFormState,
  ScheduleValidationResult,
} from "./schedule-dry-run-types";

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
  return dryRunFormInputToWritePayload(formStateToDryRunInput(form));
}

function parseOptionalIntField(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n)) return "invalid";
  return n;
}

export function formStateToDryRunInput(form: ScheduleFormState): ScheduleDryRunFormInput {
  const homeOrder = parseOptionalIntField(form.home_order);
  const sortOrder = parseOptionalIntField(form.sort_order);
  return {
    date: form.date,
    title: form.title,
    venue: form.venue,
    open_time: form.open_time,
    start_time: form.start_time,
    price: form.price,
    description: form.description,
    published: form.published,
    show_on_home: form.show_on_home,
    home_order: homeOrder === "invalid" ? null : homeOrder,
    sort_order: sortOrder === "invalid" ? null : sortOrder ?? 0,
  };
}

export function validateDryRunFormInput(
  form: ScheduleDryRunFormInput,
): ScheduleDryRunValidation {
  const asFormState: ScheduleFormState = {
    date: form.date,
    title: form.title,
    venue: form.venue,
    open_time: form.open_time,
    start_time: form.start_time,
    price: form.price,
    description: form.description,
    published: form.published,
    show_on_home: form.show_on_home,
    home_order: form.home_order != null ? String(form.home_order) : "",
    sort_order: form.sort_order != null ? String(form.sort_order) : "",
  };
  const legacy = validateScheduleForm(asFormState);
  return {
    ok: legacy.valid,
    errors: legacy.errors,
    warnings: [],
  };
}

export function dryRunFormInputToWritePayload(
  form: ScheduleDryRunFormInput,
): Record<string, unknown> {
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
    home_order: form.home_order,
    sort_order: form.sort_order ?? 0,
  };
}
