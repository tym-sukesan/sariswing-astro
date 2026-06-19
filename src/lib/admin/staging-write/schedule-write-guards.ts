/**
 * G-6-e4 — Schedule write adapter guards (staging only; no dry-run mode).
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G9G3G4_OPERATIONAL_DESCRIPTION_MARKER,
  G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL,
  G9G3G4_OPERATIONAL_TARGET_LEGACY_ID,
  G9G3G4_OPERATIONAL_TARGET_ROW_ID,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { isActiveRestoreExceptionRow } from "../staging-data/staging-schedule-site-slug-restore-exception-registry";
import {
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
  G9G4A1_SCHEDULE_VENUE_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_IDS,
  type ScheduleWriteApprovalIdUnion,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteSafety,
} from "./schedule-write-types";
import type { SingleTextFieldOperationalField } from "../staging-data/staging-schedule-single-text-field-operational-registry";

const ALLOWED_PAYLOAD_KEYS = new Set([
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "updated_at",
]);

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "id",
  "legacy_id",
  "year",
  "month",
  "image_url",
  "home_image_url",
  "source_file",
  "source_route",
  "created_at",
  "updated_by",
]);

export function getScheduleWriteSafety(): ScheduleWriteSafety {
  return {
    stagingOnly: true,
    productionBlocked: true,
    serviceRoleUsed: false,
    scheduleMonthsTouched: false,
    deleteEnabled: false,
    publishTriggered: false,
  };
}

export function assertScheduleWriteApprovalId(
  approvalId: string,
): asserts approvalId is ScheduleWriteApprovalIdUnion {
  if (!SCHEDULE_WRITE_APPROVAL_IDS.includes(approvalId as ScheduleWriteApprovalIdUnion)) {
    throw new Error(
      `Approval ID mismatch. Expected one of ${SCHEDULE_WRITE_APPROVAL_IDS.join(", ")}, got ${approvalId || "(empty)"}.`,
    );
  }
}

export function assertG6F6SafeFieldsPayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["venue", "description"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-f6 payload must include venue and description.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-f6 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("venue") || !keys.includes("description")) {
    throw new Error("G-6-f6 payload must include both venue and description.");
  }
}

export function assertG6G1TitlePayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["title"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-g1 payload must include title.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-g1 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("title")) {
    throw new Error("G-6-g1 payload must include title.");
  }
}

export function assertG6G2TimeFieldsPayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["open_time", "start_time"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-g2 payload must include open_time and start_time.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-g2 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("open_time") || !keys.includes("start_time")) {
    throw new Error("G-6-g2 payload must include both open_time and start_time.");
  }
}

export function assertG9G2TitlePayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["title"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-9g2 payload must include title.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-9g2 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("title")) {
    throw new Error("G-9g2 payload must include title.");
  }
}

export function assertG9G3bVenueDescriptionPayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["venue", "description"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-9g3b payload must include venue and description.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-9g3b payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("venue") || !keys.includes("description")) {
    throw new Error("G-9g3b payload must include both venue and description.");
  }
}

export function assertG9G3cTimePricePayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["open_time", "start_time", "price"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-9g3c payload must include open_time, start_time, and price.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-9g3c payload field not allowed: ${key}`);
    }
  }
  if (
    !keys.includes("open_time") ||
    !keys.includes("start_time") ||
    !keys.includes("price")
  ) {
    throw new Error("G-9g3c payload must include open_time, start_time, and price.");
  }
}

const G9G3D_GENERAL_EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
] as const;

export function normalizeG9G3dGeneralEditFieldValue(
  field: string,
  raw: string,
): string | null {
  const trimmed = raw.trim();
  if (field === "title") {
    if (trimmed === "") {
      throw new Error("G-9g3d title cannot be empty");
    }
    return trimmed;
  }
  return trimmed === "" ? null : trimmed;
}

export function buildG9G3dGeneralEditPayload(
  changedFields: string[],
  rawValues: Record<string, string>,
): ScheduleUpdateWritePayload {
  const payload: ScheduleUpdateWritePayload = {};
  for (const field of changedFields) {
    const normalized = normalizeG9G3dGeneralEditFieldValue(field, rawValues[field] ?? "");
    switch (field) {
      case "title":
        payload.title = normalized;
        break;
      case "venue":
        payload.venue = normalized;
        break;
      case "open_time":
        payload.open_time = normalized;
        break;
      case "start_time":
        payload.start_time = normalized;
        break;
      case "price":
        payload.price = normalized;
        break;
      case "description":
        payload.description = normalized;
        break;
      default:
        throw new Error(`G-9g3d changed field not allowed: ${field}`);
    }
  }
  return payload;
}

export function assertG9G3dGeneralEditPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
): void {
  assertG9G3gOperationalGeneralEditPayloadOnly(payload, expectedChangedFields, "G-9g3d");
}

const G9G3G_OPERATIONAL_SAFE_FIELDS = G9G3D_GENERAL_EDIT_SAFE_FIELDS;

export function assertG9G3gOperationalGeneralEditPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
  label = "G-9g3g",
): void {
  const safeSet = new Set<string>(G9G3G_OPERATIONAL_SAFE_FIELDS);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error(`${label} payload must include at least one changed field.`);
  }
  const expected = new Set(expectedChangedFields);
  if (keys.length !== expected.size) {
    throw new Error(`${label} payload keys must match changedFields exactly.`);
  }
  for (const key of keys) {
    if (!safeSet.has(key)) {
      throw new Error(`${label} payload field not allowed: ${key}`);
    }
    if (!expected.has(key)) {
      throw new Error(`${label} payload field ${key} not in changedFields`);
    }
  }
  for (const field of expectedChangedFields) {
    if (!keys.includes(field)) {
      throw new Error(`${label} payload missing ${field}`);
    }
  }
  if (payload.title !== undefined && (payload.title === null || payload.title === "")) {
    throw new Error(`${label} title cannot be empty`);
  }
}

export function assertOperationalNotPocAuditRow(
  row: ScheduleDryRunSource,
  label = "G-9g3g",
): void {
  if (isActiveRestoreExceptionRow(row)) {
    return;
  }
  if (row.id === "aa440e29-5be8-402e-9190-0d81c48434c0") {
    throw new Error(`${label} PoC audit row is not writable.`);
  }
  const fields = [
    row.title,
    row.venue,
    row.open_time,
    row.start_time,
    row.price,
    row.description,
  ];
  if (fields.some((value) => String(value ?? "").includes("[CMS Kit staging]"))) {
    throw new Error(`${label} PoC audit marker row is not writable.`);
  }
}

/** G-9g3g5 restore — marker row writable only when id/legacy/site_slug match restore target. */
export function assertG9G3g5RestoreWritableRow(row: ScheduleDryRunSource): void {
  if (row.id !== G9G3G4_OPERATIONAL_TARGET_ROW_ID) {
    throw new Error("G-9g3g5 restore target id mismatch.");
  }
  if (row.legacy_id !== G9G3G4_OPERATIONAL_TARGET_LEGACY_ID) {
    throw new Error("G-9g3g5 restore legacy_id mismatch.");
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error("G-9g3g5 restore site_slug mismatch.");
  }
  const description = String(row.description ?? "");
  if (!description.includes(G9G3G4_OPERATIONAL_DESCRIPTION_MARKER)) {
    throw new Error(
      "G-9g3g5 restore before description must include G-9g3g4 temporary marker.",
    );
  }
}

export function assertG9G3g5RestorePayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
): void {
  if (expectedChangedFields.length !== 1 || expectedChangedFields[0] !== "description") {
    throw new Error("G-9g3g5 restore changedFields must be description only.");
  }
  assertG9G3gOperationalGeneralEditPayloadOnly(
    payload,
    expectedChangedFields,
    "G-9g3g5",
  );
  if (payload.description !== G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL) {
    throw new Error("G-9g3g5 restore payload description must equal original candidate.");
  }
}

export function assertOperationalPreviewIdentityPresent(
  previewIdentity: string | undefined,
): void {
  if (!String(previewIdentity ?? "").trim()) {
    throw new Error("previewIdentity required for operational Save.");
  }
}

export function assertOperationalPreviewNotConsumed(options: {
  previewIdentity: string;
  consumedPreviewIdentity?: string | null;
}): void {
  if (
    options.consumedPreviewIdentity &&
    options.consumedPreviewIdentity === options.previewIdentity
  ) {
    throw new Error(
      "Operational Save re-click blocked — preview consumed by prior successful Save.",
    );
  }
}

export function assertOperationalCandidatePreviewMatch(options: {
  changedFields: string[];
  candidateValues: Record<string, string>;
  previewValues: Record<string, string>;
  label?: string;
}): void {
  const label = options.label ?? "G-9g3g";
  for (const field of options.changedFields) {
    const candidate = options.candidateValues[field] ?? "";
    const preview = options.previewValues[field] ?? "";
    if (candidate !== preview) {
      throw new Error(
        `${label} candidate ${field} does not match latest G-9 preview value.`,
      );
    }
  }
}

export function assertOperationalPreviewTargetIdentity(options: {
  beforeSnapshot: ScheduleDryRunSource;
  previewTargetId: string;
  previewLegacyId: string | null;
  previewSiteSlug: string;
  label?: string;
}): void {
  const label = options.label ?? "G-9g3g";
  if (options.beforeSnapshot.id !== options.previewTargetId) {
    throw new Error(`${label} selected row id does not match preview target id.`);
  }
  if (
    options.beforeSnapshot.legacy_id !== options.previewLegacyId &&
    options.previewLegacyId != null
  ) {
    throw new Error(`${label} selected row legacy_id does not match preview target.`);
  }
  if (options.beforeSnapshot.site_slug !== options.previewSiteSlug) {
    throw new Error(`${label} selected row site_slug does not match preview target.`);
  }
}

export function buildG9G3gOperationalGeneralEditPayload(
  changedFields: string[],
  rawValues: Record<string, string>,
): ScheduleUpdateWritePayload {
  return buildG9G3dGeneralEditPayload(changedFields, rawValues);
}

const G9G4A1_VENUE_ONLY_ALLOWED_PAYLOAD_KEYS = new Set(["venue"]);

const G9G4A1_FORBIDDEN_MUTATION_KEYS = new Set([
  "date",
  "year",
  "month",
  "source_route",
  "source_file",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "image_url",
  "home_image_url",
  "id",
  "legacy_id",
  "site_slug",
  "created_at",
  "updated_at",
  "title",
  "description",
  "open_time",
  "start_time",
  "price",
]);

export function assertG9G4a1VenueOnlyChangedFieldsOnly(
  changedFields: string[],
  label = "G-9g4a1",
): void {
  if (changedFields.length !== 1 || changedFields[0] !== "venue") {
    throw new Error(`${label} changedFields must be exactly ["venue"].`);
  }
}

export function assertG9G4a1NoRouteDatePublicationImageMutation(
  payload: ScheduleUpdateWritePayload,
  label = "G-9g4a1",
): void {
  for (const key of Object.keys(payload)) {
    if (G9G4A1_FORBIDDEN_MUTATION_KEYS.has(key)) {
      throw new Error(`${label} forbidden payload field: ${key}`);
    }
    if (!G9G4A1_VENUE_ONLY_ALLOWED_PAYLOAD_KEYS.has(key)) {
      throw new Error(`${label} disallowed payload field: ${key}`);
    }
  }
}

export function assertG9G4a1VenueOnlyPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
  label = "G-9g4a1",
): void {
  assertG9G4a1VenueOnlyChangedFieldsOnly(expectedChangedFields, label);
  assertG9G4a1NoRouteDatePublicationImageMutation(payload, label);
  const keys = Object.keys(payload);
  if (keys.length !== 1 || !keys.includes("venue")) {
    throw new Error(`${label} payload must be exactly { venue: string }.`);
  }
  const venue = payload.venue;
  if (typeof venue !== "string" || venue.trim() === "") {
    throw new Error(`${label} venue must be a non-empty string.`);
  }
}

export function assertG9G4a1VenueOnlyApproval(
  approvalId: string,
  label = "G-9g4a1",
): void {
  if (approvalId !== G9G4A1_SCHEDULE_VENUE_ONLY_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${label} approval ID mismatch.`);
  }
}

export function assertG9G4a1VenueOnlyWritableRow(
  row: ScheduleDryRunSource,
  label = "G-9g4a1",
): void {
  assertOperationalNotPocAuditRow(row, label);
}

export function buildG9G4a1VenueOnlyPayload(venueRaw: string): ScheduleUpdateWritePayload {
  const trimmed = venueRaw.trim();
  if (trimmed === "") {
    throw new Error("G-9g4a1 venue cannot be empty.");
  }
  return { venue: trimmed };
}

const G9G4A2A_OPEN_TIME_ONLY_ALLOWED_PAYLOAD_KEYS = new Set(["open_time"]);

const G9G4A2A_FORBIDDEN_MUTATION_KEYS = new Set([
  "date",
  "year",
  "month",
  "source_route",
  "source_file",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "image_url",
  "home_image_url",
  "id",
  "legacy_id",
  "site_slug",
  "created_at",
  "updated_at",
  "title",
  "description",
  "venue",
  "start_time",
  "price",
]);

export function assertG9G4a2aOpenTimeOnlyChangedFieldsOnly(
  changedFields: string[],
  label = "G-9g4a2a",
): void {
  if (changedFields.length !== 1 || changedFields[0] !== "open_time") {
    throw new Error(`${label} changedFields must be exactly ["open_time"].`);
  }
}

export function assertG9G4a2aNoRouteDatePublicationImageMutation(
  payload: ScheduleUpdateWritePayload,
  label = "G-9g4a2a",
): void {
  for (const key of Object.keys(payload)) {
    if (G9G4A2A_FORBIDDEN_MUTATION_KEYS.has(key)) {
      throw new Error(`${label} forbidden payload field: ${key}`);
    }
    if (!G9G4A2A_OPEN_TIME_ONLY_ALLOWED_PAYLOAD_KEYS.has(key)) {
      throw new Error(`${label} disallowed payload field: ${key}`);
    }
  }
}

export function assertG9G4a2aOpenTimeOnlyPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
  label = "G-9g4a2a",
): void {
  assertG9G4a2aOpenTimeOnlyChangedFieldsOnly(expectedChangedFields, label);
  assertG9G4a2aNoRouteDatePublicationImageMutation(payload, label);
  const keys = Object.keys(payload);
  if (keys.length !== 1 || !keys.includes("open_time")) {
    throw new Error(`${label} payload must be exactly { open_time: string }.`);
  }
  const openTime = payload.open_time;
  if (typeof openTime !== "string" || openTime.trim() === "") {
    throw new Error(`${label} open_time must be a non-empty string.`);
  }
}

export function assertG9G4a2aOpenTimeOnlyApproval(
  approvalId: string,
  label = "G-9g4a2a",
): void {
  if (approvalId !== G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${label} approval ID mismatch.`);
  }
}

export function assertG9G4a2aOpenTimeOnlyWritableRow(
  row: ScheduleDryRunSource,
  label = "G-9g4a2a",
): void {
  assertOperationalNotPocAuditRow(row, label);
}

export function buildG9G4a2aOpenTimeOnlyPayload(
  openTimeRaw: string,
): ScheduleUpdateWritePayload {
  const trimmed = openTimeRaw.trim();
  if (trimmed === "") {
    throw new Error("G-9g4a2a open_time cannot be empty.");
  }
  return { open_time: trimmed };
}

const SINGLE_TEXT_FIELD_SAFE_TEXT_KEYS = [
  "venue",
  "title",
  "description",
  "open_time",
  "start_time",
  "price",
] as const;

const SINGLE_TEXT_FIELD_METADATA_FORBIDDEN_KEYS = new Set([
  "date",
  "year",
  "month",
  "source_route",
  "source_file",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "image_url",
  "home_image_url",
  "id",
  "legacy_id",
  "site_slug",
  "created_at",
  "updated_at",
]);

function getSingleTextFieldForbiddenMutationKeys(fieldName: string): Set<string> {
  const forbidden = new Set(SINGLE_TEXT_FIELD_METADATA_FORBIDDEN_KEYS);
  for (const key of SINGLE_TEXT_FIELD_SAFE_TEXT_KEYS) {
    if (key !== fieldName) {
      forbidden.add(key);
    }
  }
  return forbidden;
}

export function assertSingleTextFieldChangedFieldsOnly(
  fieldName: string,
  changedFields: string[],
  label = "G-9g4a2",
): void {
  if (changedFields.length !== 1 || changedFields[0] !== fieldName) {
    throw new Error(`${label} changedFields must be exactly ["${fieldName}"].`);
  }
}

export function assertSingleTextFieldNoRouteDatePublicationImageMutation(
  fieldName: string,
  payload: ScheduleUpdateWritePayload,
  label = "G-9g4a2",
): void {
  const forbidden = getSingleTextFieldForbiddenMutationKeys(fieldName);
  for (const key of Object.keys(payload)) {
    if (forbidden.has(key)) {
      throw new Error(`${label} forbidden payload field: ${key}`);
    }
    if (key !== fieldName) {
      throw new Error(`${label} disallowed payload field: ${key}`);
    }
  }
}

export function assertSingleTextFieldPayloadOnly(
  fieldName: string,
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
  validate: (value: string) => boolean,
  label = "G-9g4a2",
): void {
  assertSingleTextFieldChangedFieldsOnly(fieldName, expectedChangedFields, label);
  assertSingleTextFieldNoRouteDatePublicationImageMutation(fieldName, payload, label);
  const keys = Object.keys(payload);
  if (keys.length !== 1 || !keys.includes(fieldName)) {
    throw new Error(`${label} payload must be exactly { ${fieldName}: string }.`);
  }
  const value = payload[fieldName as keyof ScheduleUpdateWritePayload];
  if (typeof value !== "string" || !validate(value)) {
    throw new Error(`${label} ${fieldName} must be a non-empty string.`);
  }
}

export function assertSingleTextFieldApproval(
  entry: Pick<SingleTextFieldOperationalField, "fieldName" | "approvalId">,
  approvalId: string,
  label = "G-9g4a2",
): void {
  if (approvalId !== entry.approvalId) {
    throw new Error(`${label} approval ID mismatch for ${entry.fieldName}.`);
  }
}

export function assertSingleTextFieldWritableRow(
  row: ScheduleDryRunSource,
  label = "G-9g4a2",
): void {
  assertOperationalNotPocAuditRow(row, label);
}

export function buildSingleTextFieldPayload(
  fieldName: string,
  rawValue: string,
  validate: (value: string) => boolean,
  label = "G-9g4a2",
): ScheduleUpdateWritePayload {
  const trimmed = rawValue.trim();
  if (!validate(trimmed)) {
    throw new Error(`${label} ${fieldName} cannot be empty.`);
  }
  return { [fieldName]: trimmed };
}

export function assertBeforeSnapshotSiteSlugScope(
  beforeSnapshot: ScheduleDryRunSource,
  options: { siteSlug: string; legacyId: string; targetId: string },
): void {
  if (beforeSnapshot.id !== options.targetId) {
    throw new Error(
      `beforeSnapshot id (${beforeSnapshot.id}) does not match target (${options.targetId}).`,
    );
  }
  if (beforeSnapshot.legacy_id !== options.legacyId) {
    throw new Error(
      `beforeSnapshot legacy_id (${beforeSnapshot.legacy_id ?? "null"}) does not match ${options.legacyId}.`,
    );
  }
  if (beforeSnapshot.site_slug !== options.siteSlug) {
    throw new Error(
      `beforeSnapshot site_slug (${beforeSnapshot.site_slug ?? "null"}) does not match ${options.siteSlug}.`,
    );
  }
}

export function assertScheduleWriteTargetId(targetId: string): void {
  if (typeof targetId !== "string" || targetId.trim() === "") {
    throw new Error("targetId must be a non-empty string.");
  }
}

export function assertBeforeSnapshotMatchesTarget(
  beforeSnapshot: ScheduleDryRunSource,
  targetId: string,
): void {
  const normalizedTarget = targetId.trim();
  const idMatches = beforeSnapshot.id === normalizedTarget;
  const legacyMatches =
    beforeSnapshot.legacy_id != null &&
    String(beforeSnapshot.legacy_id) === normalizedTarget;

  if (!idMatches && !legacyMatches) {
    throw new Error(
      `beforeSnapshot id (${beforeSnapshot.id}) does not match targetId (${normalizedTarget}).`,
    );
  }
}

export function assertScheduleUpdatePayloadAllowed(
  payload: ScheduleUpdateWritePayload,
): void {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("payload must include at least one allowed field.");
  }

  for (const key of keys) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key)) {
      throw new Error(`Forbidden payload field: ${key}`);
    }
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) {
      throw new Error(`Disallowed payload field: ${key}`);
    }
  }
}
