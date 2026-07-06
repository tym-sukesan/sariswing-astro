/**
 * Gosaki staging shell — operator schedule add/edit UI (G-9k4a Save path; default disabled).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  executeG9kExistingEventSaveButtonDryRun,
  type G9kExistingEventSaveButtonDryRunResult,
  type G9kExistingEventSaveButtonFormValues,
} from "../staging-write/gosaki-schedule-existing-event-save-button-dry-run";
import {
  evaluateG9kOperatorSaveButtonUiGate,
  getG9kExistingEventSaveButtonConfig,
} from "../staging-write/gosaki-schedule-existing-event-save-button-config";
import { readG9kSaveButtonPageConfigFromDom } from "../staging-write/gosaki-schedule-save-button-page-config";
import {
  executeG9kExistingEventSaveButtonSave,
  type G9kExistingEventSaveButtonSaveOutcome,
} from "../staging-write/gosaki-schedule-existing-event-save-button-save";
import {
  G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS,
  type G9kExistingEventSaveButtonSafeField,
} from "../staging-write/gosaki-schedule-existing-event-save-button-guards";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "./staging-schedule-site-slug-config";
import { dispatchRowSelected } from "./staging-schedule-site-slug-row-picker-events";
import { confirmDiscardDirtyCandidateIfNeeded } from "./staging-schedule-site-slug-edit-picker-binding";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";
import {
  buildGosakiScheduleDuplicateDraft,
  executeG22bScheduleDuplicateDryRun,
  GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL,
  GOSAKI_SCHEDULE_DUPLICATE_DRAFT_UNSAVED_ID,
  type G22bScheduleDuplicateDryRunResult,
  type GosakiScheduleDuplicateDraftState,
} from "../staging-write/gosaki-schedule-duplicate-dry-run";
import {
  evaluateG22dDuplicateInsertUiGate,
  getG22dDuplicateInsertConfig,
  G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID,
  G22D_DUPLICATE_INSERT_SOURCE_ID,
} from "../staging-write/gosaki-schedule-duplicate-insert-config";
import {
  executeG22dScheduleDuplicateInsertSave,
  type G22dDuplicateInsertSaveOutcome,
} from "../staging-write/gosaki-schedule-duplicate-insert-save";
import {
  buildGosakiScheduleNewEventDraft,
  executeG22eScheduleNewEventDryRun,
  GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL,
  GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_UNSAVED_ID,
  type G22eScheduleNewEventDryRunResult,
  type GosakiScheduleNewEventDraftState,
} from "../staging-write/gosaki-schedule-new-event-dry-run";
import {
  evaluateG22eNewEventInsertUiGate,
  getG22eNewEventInsertConfig,
  G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID,
} from "../staging-write/gosaki-schedule-new-event-insert-config";
import {
  computeG22ePlannedAllocation,
  scheduleRecordsToMonthAllocationRows,
} from "../staging-write/gosaki-schedule-new-event-insert-guards";
import {
  executeG22eScheduleNewEventInsertSave,
  type G22eNewEventInsertSaveOutcome,
} from "../staging-write/gosaki-schedule-new-event-insert-save";
import {
  buildGosakiScheduleUnpublishDraft,
  executeG22fScheduleUnpublishDryRun,
  type G22fScheduleUnpublishDryRunResult,
  type GosakiScheduleUnpublishDraftState,
} from "../staging-write/gosaki-schedule-unpublish-dry-run";
import {
  evaluateG22fUnpublishUpdateUiGate,
  getG22fUnpublishUpdateConfig,
} from "../staging-write/gosaki-schedule-unpublish-update-config";
import {
  G22F_PROTECTED_LEGACY_SCHEDULE_2026_03_014,
  G22F_PROTECTED_LEGACY_SCHEDULE_2026_09_001,
} from "../staging-write/gosaki-schedule-unpublish-update-guards";
import {
  executeG22fScheduleUnpublishUpdateSave,
  type G22fUnpublishUpdateSaveOutcome,
} from "../staging-write/gosaki-schedule-unpublish-update-save";
import type { GosakiScheduleEditDraftMode } from "../staging-write/schedule-dry-run-types";

type PublishedFilter = "published" | "all" | "draft";

const G9K2_EDIT_DRY_RUN_FIELD_IDS: Record<G9kExistingEventSaveButtonSafeField, string> = {
  title: "gosaki-edit-title",
  venue: "gosaki-edit-venue",
  open_time: "gosaki-edit-open-time",
  start_time: "gosaki-edit-start-time",
  price: "gosaki-edit-price",
  description: "gosaki-edit-description",
};

const G9K2_FIELD_LABELS: Record<G9kExistingEventSaveButtonSafeField, string> = {
  title: "タイトル",
  venue: "会場",
  open_time: "開場",
  start_time: "開演",
  price: "料金",
  description: "備考 / 説明",
};

let selectableRows: ScheduleRecord[] = [];
let selectedRowId: string | null = null;
let selectedRowSnapshot: ScheduleRecord | null = null;
let lastDryRunResult: G9kExistingEventSaveButtonDryRunResult | null = null;
let lastSaveOutcome: G9kExistingEventSaveButtonSaveOutcome | null = null;
let stagingAuthSignedIn: boolean | null = null;
let saveInFlight = false;
let previewBase = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
let editDraftMode: GosakiScheduleEditDraftMode = "existing";
let duplicateSourceSnapshot: ScheduleRecord | null = null;
let duplicateDraftState: GosakiScheduleDuplicateDraftState | null = null;
let lastDuplicateDryRunResult: G22bScheduleDuplicateDryRunResult | null = null;
let newEventDraftState: GosakiScheduleNewEventDraftState | null = null;
let lastNewEventDryRunResult: G22eScheduleNewEventDryRunResult | null = null;
let unpublishDraftState: GosakiScheduleUnpublishDraftState | null = null;
let unpublishTargetSnapshot: ScheduleRecord | null = null;
let lastUnpublishDryRunResult: G22fScheduleUnpublishDryRunResult | null = null;

const G22F_EDIT_FORM_FIELD_IDS = [
  "gosaki-edit-date",
  "gosaki-edit-title",
  "gosaki-edit-venue",
  "gosaki-edit-open-time",
  "gosaki-edit-start-time",
  "gosaki-edit-price",
  "gosaki-edit-description",
  "gosaki-edit-published",
] as const;

function isG9kOperatorSaveEnabled(): boolean {
  return getG9kExistingEventSaveButtonConfig().saveEnabled;
}

function operatorSaveDisabledMessage(): string {
  return "保存が必要な場合は戸山が代行します。";
}

function operatorSaveDisabledDryRunCompleteMessage(): string {
  return "保存は無効です。確認のみ完了しました。";
}

function operatorSaveEnabledMessage(): string {
  return "保存が有効です。内容を確認し、「更新する」を1回だけ押すとDBに反映されます。";
}

function operatorSavePrepMessage(): string {
  if (isG9kOperatorSaveEnabled()) {
    return "「変更を確認」で内容を確認してから「更新する」を押してください。";
  }
  return `「変更を確認」で内容を確認できます。${operatorSaveDisabledMessage()}`;
}

function setSaveButtonNote(text: string | null): void {
  const note = document.getElementById("gosaki-schedule-update-btn-note");
  if (!note) return;
  if (!text) {
    note.hidden = true;
    note.textContent = "";
    return;
  }
  note.hidden = false;
  note.textContent = text;
}

function renderDryRunOutcomeNote(
  saveReadiness: G9kExistingEventSaveButtonDryRunResult["saveReadiness"],
): string {
  if (saveReadiness === "ready_but_save_disabled") {
    return "";
  }
  if (saveReadiness === "ready_to_save") {
    return `<p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存はまだ実行されません。</p>`;
  }
  return "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
}

function displayDryRunValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || "（空）";
}

function getRoot(): HTMLElement | null {
  return document.getElementById("gosaki-schedule-operator");
}

function parseRowsDataset(): ScheduleRecord[] {
  const root = getRoot();
  if (!root) return [];
  previewBase = root.dataset.previewBase ?? previewBase;
  const raw = root.dataset.selectableRows;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScheduleRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeDateInput(date: string): string {
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slash) return `${slash[1]}-${slash[2]}-${slash[3]}`;
  return "";
}

function monthFromDate(date: string): string {
  const normalized = normalizeDateInput(date);
  if (!normalized) return "";
  return normalized.slice(0, 7);
}

function formatMonthHint(date: string): string {
  const month = monthFromDate(date);
  if (!month) {
    return "日付を選ぶと、表示先の月が自動で決まります。";
  }
  const [year, mon] = month.split("-");
  const monthNum = Number(mon);
  return `表示先：${year}年${monthNum}月のスケジュールページ`;
}

function setMonthHint(elementId: string, date: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = formatMonthHint(date);
}

function schedulePreviewUrl(month: string | null | undefined): string {
  const normalized = String(month ?? "").trim();
  if (normalized && /^\d{4}-\d{2}$/.test(normalized)) {
    return `${previewBase}${normalized}/`;
  }
  return `${previewBase}schedule/`;
}

function setPreviewLink(linkId: string, month: string | null | undefined): void {
  const link = document.getElementById(linkId) as HTMLAnchorElement | null;
  if (!link) return;
  const url = schedulePreviewUrl(month);
  link.href = url;
  link.textContent =
    month && /^\d{4}-\d{2}$/.test(month)
      ? `${month} のページを見る`
      : "スケジュールページを見る";
}

function getMonthFilter(): string {
  const el = document.getElementById(
    "gosaki-schedule-operator-month-filter",
  ) as HTMLSelectElement | null;
  return el?.value ?? "all";
}

function getPublishedFilter(): PublishedFilter {
  const el = document.getElementById(
    "gosaki-schedule-operator-published-filter",
  ) as HTMLSelectElement | null;
  const value = el?.value ?? "published";
  if (value === "all" || value === "draft") return value;
  return "published";
}

function getKeywordFilter(): string {
  const el = document.getElementById(
    "gosaki-schedule-operator-keyword",
  ) as HTMLInputElement | null;
  return (el?.value ?? "").trim().toLowerCase();
}

function rowMatchesFilters(row: ScheduleRecord): boolean {
  const monthFilter = getMonthFilter();
  if (monthFilter !== "all" && String(row.month ?? "") !== monthFilter) return false;

  const publishedFilter = getPublishedFilter();
  if (publishedFilter === "published" && row.published !== true) return false;
  if (publishedFilter === "draft" && row.published !== false) return false;

  const keyword = getKeywordFilter();
  if (keyword) {
    const haystack = [row.title, row.venue, row.description]
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");
    if (!haystack.includes(keyword)) return false;
  }

  return true;
}

function setFieldValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value;
}

function formatTimes(row: ScheduleRecord): string {
  const open = String(row.open_time ?? "").trim();
  const start = String(row.start_time ?? "").trim();
  const openLabel = open || "—";
  const startLabel = start || "—";
  if (!open && !start) return "—";
  return `開場 ${openLabel} / 開演 ${startLabel}`;
}

function formatPriceLabel(price: string | null | undefined): string {
  const value = String(price ?? "").trim();
  if (!value) return "—";
  return value.startsWith("料金") ? value : `料金 ${value}`;
}

function setCheckbox(id: string, checked: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = checked;
}

function isDuplicateDraftMode(): boolean {
  return editDraftMode === "duplicate" && duplicateDraftState !== null;
}

function isNewEventDraftMode(): boolean {
  return editDraftMode === "new" && newEventDraftState !== null;
}

function isUnpublishDraftMode(): boolean {
  return editDraftMode === "unpublish" && unpublishDraftState !== null;
}

function resetUnpublishDraftMode(): void {
  editDraftMode = "existing";
  unpublishDraftState = null;
  unpublishTargetSnapshot = null;
  lastUnpublishDryRunResult = null;
  updateUnpublishDraftBanner(null);
  setEditFormFieldsReadOnly(false);
}

function resetNewEventDraftMode(): void {
  editDraftMode = "existing";
  newEventDraftState = null;
  lastNewEventDryRunResult = null;
  updateNewEventDraftBanner(null);
}

function resetDuplicateDraftMode(): void {
  editDraftMode = "existing";
  duplicateSourceSnapshot = null;
  duplicateDraftState = null;
  lastDuplicateDryRunResult = null;
  updateDuplicateDraftBanner(null);
}

function resetNonExistingDraftModes(): void {
  resetDuplicateDraftMode();
  resetNewEventDraftMode();
  resetUnpublishDraftMode();
}

function setEditFormFieldsReadOnly(readOnly: boolean): void {
  for (const id of G22F_EDIT_FORM_FIELD_IDS) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.disabled = readOnly;
  }
}

function updateUnpublishDraftBanner(state: GosakiScheduleUnpublishDraftState | null): void {
  const banner = document.getElementById("gosaki-schedule-unpublish-draft-banner");
  if (!banner) return;

  if (!state) {
    banner.hidden = true;
    banner.dataset.draftMode = "";
    banner.dataset.targetId = "";
    banner.dataset.targetLegacyId = "";
    const label = banner.querySelector("[data-target-label]");
    if (label) label.textContent = "";
    return;
  }

  banner.hidden = false;
  banner.dataset.draftMode = "unpublish";
  banner.dataset.targetId = state.targetId;
  banner.dataset.targetLegacyId = state.targetLegacyId ?? "";
  const label = banner.querySelector("[data-target-label]");
  if (label) {
    const legacy = state.targetLegacyId ? ` / ${state.targetLegacyId}` : "";
    label.textContent = `${state.targetId}${legacy}`;
  }
}

function updateUnpublishButtonState(): void {
  const button = document.getElementById(
    "gosaki-schedule-unpublish-btn",
  ) as HTMLButtonElement | null;
  if (!button) return;

  if (isNewEventDraftMode() || isDuplicateDraftMode() || isUnpublishDraftMode()) {
    button.disabled = true;
    button.title = "他の案を編集中です。先に案をやめるか、別の操作を選んでください。";
    return;
  }

  const row = selectedRowSnapshot;
  if (!row) {
    button.disabled = true;
    button.title = "先に一覧から公演を選んでください。";
    return;
  }

  if (row.published !== true) {
    button.disabled = true;
    button.title = "このイベントはすでに非公開です。";
    return;
  }

  button.disabled = false;
  button.removeAttribute("data-gosaki-schedule-action-disabled");
  button.title = "選択中の公演を非公開にする案を作成します（保存はまだできません）";
}

function updateDuplicateDraftBanner(state: GosakiScheduleDuplicateDraftState | null): void {
  const banner = document.getElementById("gosaki-schedule-duplicate-draft-banner");
  if (!banner) return;

  if (!state) {
    banner.hidden = true;
    banner.dataset.draftMode = "";
    banner.dataset.sourceId = "";
    banner.dataset.sourceLegacyId = "";
    const label = banner.querySelector("[data-source-label]");
    if (label) label.textContent = "";
    return;
  }

  banner.hidden = false;
  banner.dataset.draftMode = "duplicate";
  banner.dataset.sourceId = state.sourceId;
  banner.dataset.sourceLegacyId = state.sourceLegacyId ?? "";
  const label = banner.querySelector("[data-source-label]");
  if (label) {
    const legacy = state.sourceLegacyId ? ` / ${state.sourceLegacyId}` : "";
    label.textContent = `${state.sourceId}${legacy}`;
  }
}

function updateNewEventDraftBanner(state: GosakiScheduleNewEventDraftState | null): void {
  const banner = document.getElementById("gosaki-schedule-new-event-draft-banner");
  if (!banner) return;

  if (!state) {
    banner.hidden = true;
    banner.dataset.draftMode = "";
    return;
  }

  banner.hidden = false;
  banner.dataset.draftMode = "new";
}

function readEditFormDate(): string {
  const el = document.getElementById("gosaki-edit-date") as HTMLInputElement | null;
  return normalizeDateInput(el?.value ?? "");
}

function readEditFormPublished(): boolean {
  const el = document.getElementById("gosaki-edit-published") as HTMLInputElement | null;
  return el?.checked === true;
}

function readAddFormSeed(): Partial<ScheduleRecord> {
  const date = normalizeDateInput(
    (document.getElementById("gosaki-add-date") as HTMLInputElement | null)?.value ?? "",
  );
  const publishedEl = document.getElementById("gosaki-add-published") as HTMLInputElement | null;
  return {
    date,
    title: String(
      (document.getElementById("gosaki-add-title") as HTMLInputElement | null)?.value ?? "",
    ),
    venue: String(
      (document.getElementById("gosaki-add-venue") as HTMLInputElement | null)?.value ?? "",
    ),
    open_time: String(
      (document.getElementById("gosaki-add-open-time") as HTMLInputElement | null)?.value ?? "",
    ),
    start_time: String(
      (document.getElementById("gosaki-add-start-time") as HTMLInputElement | null)?.value ?? "",
    ),
    price: String(
      (document.getElementById("gosaki-add-price") as HTMLInputElement | null)?.value ?? "",
    ),
    description: String(
      (document.getElementById("gosaki-add-description") as HTMLTextAreaElement | null)?.value ??
        "",
    ),
    published: publishedEl?.checked === true,
  };
}

function enterNewEventDraftMode(): void {
  if (isUnpublishDraftMode()) {
    if (
      !window.confirm(
        "非公開化案の編集をやめて、新規追加案を作成しますか？（非公開化案は保存されません）",
      )
    ) {
      return;
    }
    resetUnpublishDraftMode();
  }

  if (isDuplicateDraftMode()) {
    if (
      !window.confirm(
        "複製案の編集をやめて、新規追加案を作成しますか？（複製案は保存されません）",
      )
    ) {
      return;
    }
    resetDuplicateDraftMode();
  }

  if (isNewEventDraftMode()) {
    document
      .getElementById("gosaki-schedule-operator-edit")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  const seed = readAddFormSeed();
  newEventDraftState = buildGosakiScheduleNewEventDraft({
    ...seed,
    published: false,
  });
  editDraftMode = "new";
  selectedRowId = null;
  selectedRowSnapshot = null;
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  lastNewEventDryRunResult = null;
  clearSaveResult();
  clearDryRunResult();
  updateDuplicateDraftBanner(null);
  updateNewEventDraftBanner(newEventDraftState);
  renderEditForm(newEventDraftState.draft, { clearDryRun: false });
  updateSaveButtonState(null);
  scrollNewEventDraftIntoView();
}

function scrollNewEventDraftIntoView(): void {
  const editPanel = document.getElementById("gosaki-schedule-operator-edit");
  editPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  const dryRunBtn = document.getElementById("gosaki-schedule-edit-dry-run-btn");
  if (dryRunBtn) {
    window.setTimeout(() => {
      dryRunBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }
}

function enterDuplicateDraftFromSelectedRow(): void {
  if (isUnpublishDraftMode()) {
    if (
      !window.confirm(
        "非公開化案の編集をやめて、複製案を作成しますか？（非公開化案は保存されません）",
      )
    ) {
      return;
    }
    resetUnpublishDraftMode();
  }

  if (isNewEventDraftMode()) {
    if (
      !window.confirm(
        "新規追加案の編集をやめて、複製案を作成しますか？（新規追加案は保存されません）",
      )
    ) {
      return;
    }
    resetNewEventDraftMode();
  }

  if (!selectedRowSnapshot || selectedRowSnapshot.id === GOSAKI_SCHEDULE_DUPLICATE_DRAFT_UNSAVED_ID) {
    window.alert("先に一覧から複製元の公演を選んでください。");
    return;
  }

  duplicateSourceSnapshot = { ...selectedRowSnapshot };
  duplicateDraftState = buildGosakiScheduleDuplicateDraft(selectedRowSnapshot);
  editDraftMode = "duplicate";
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  clearSaveResult();
  clearDryRunResult();
  updateDuplicateDraftBanner(duplicateDraftState);
  renderEditForm(duplicateDraftState.draft, { clearDryRun: false });
  updateSaveButtonState(null);
  document
    .getElementById("gosaki-schedule-operator-edit")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function enterUnpublishDraftFromSelectedRow(): void {
  if (isNewEventDraftMode()) {
    if (
      !window.confirm(
        "新規追加案の編集をやめて、非公開化案を作成しますか？（新規追加案は保存されません）",
      )
    ) {
      return;
    }
    resetNewEventDraftMode();
  }

  if (isDuplicateDraftMode()) {
    if (
      !window.confirm(
        "複製案の編集をやめて、非公開化案を作成しますか？（複製案は保存されません）",
      )
    ) {
      return;
    }
    resetDuplicateDraftMode();
  }

  if (!selectedRowSnapshot) {
    window.alert("先に一覧から非公開にする公演を選んでください。");
    return;
  }

  if (selectedRowSnapshot.published !== true) {
    window.alert("このイベントはすでに非公開です。非公開化の対象にできません。");
    updateUnpublishButtonState();
    return;
  }

  unpublishTargetSnapshot = { ...selectedRowSnapshot };
  unpublishDraftState = buildGosakiScheduleUnpublishDraft(selectedRowSnapshot);
  editDraftMode = "unpublish";
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  lastNewEventDryRunResult = null;
  lastUnpublishDryRunResult = null;
  clearSaveResult();
  clearDryRunResult();
  updateDuplicateDraftBanner(null);
  updateNewEventDraftBanner(null);
  updateUnpublishDraftBanner(unpublishDraftState);
  setEditFormFieldsReadOnly(true);
  renderEditForm(unpublishDraftState.source, { clearDryRun: false });
  updateSaveButtonState(null);
  updateUnpublishButtonState();
  document
    .getElementById("gosaki-schedule-operator-edit")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function populateAddFormFromRow(row: ScheduleRecord): void {
  const date = row.date ?? "";
  setFieldValue("gosaki-add-date", date);
  setFieldValue("gosaki-add-title", String(row.title ?? ""));
  setFieldValue("gosaki-add-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-add-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-add-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-add-price", String(row.price ?? ""));
  setFieldValue("gosaki-add-description", String(row.description ?? ""));
  setCheckbox("gosaki-add-published", row.published === true);
  setMonthHint("gosaki-add-month-hint", date);
  setPreviewLink("gosaki-add-preview-link", monthFromDate(date));
}

function setEditFormUpdatedAt(value: string | null | undefined): void {
  const el = document.getElementById("gosaki-edit-updated-at-value");
  if (!el) return;
  if (isDuplicateDraftMode()) {
    el.textContent = "（未保存）";
    return;
  }
  if (isNewEventDraftMode()) {
    el.textContent = "（未保存）";
    return;
  }
  if (isUnpublishDraftMode()) {
    el.textContent = String(value ?? "").trim() || "—";
    return;
  }
  el.textContent = String(value ?? "").trim() || "—";
}

function setEditFormLegacyId(value: string | null | undefined): void {
  const el = document.getElementById("gosaki-edit-legacy-id-value");
  if (!el) return;
  if (isDuplicateDraftMode()) {
    el.textContent = GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL;
    return;
  }
  if (isNewEventDraftMode()) {
    el.textContent = GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL;
    return;
  }
  if (isUnpublishDraftMode()) {
    el.textContent = String(value ?? "").trim() || "—";
    return;
  }
  el.textContent = String(value ?? "").trim() || "—";
}

function isG9kSaveOutcomeSuccess(outcome: G9kExistingEventSaveButtonSaveOutcome): boolean {
  if (outcome.errorCode) return false;
  if (!outcome.result) return false;
  return !("errorCode" in outcome.result);
}

function renderEditForm(
  row: ScheduleRecord | null,
  options?: { clearDryRun?: boolean },
): void {
  const emptyEl = document.getElementById("gosaki-schedule-operator-edit-empty");
  const formEl = document.getElementById("gosaki-schedule-edit-form");
  const titleEl = document.querySelector(
    "#gosaki-schedule-operator-edit .admin-gosaki-card__title",
  );
  const leadEl = document.querySelector(
    "#gosaki-schedule-operator-edit .admin-gosaki-card__lead",
  );
  if (!emptyEl || !formEl) return;

  if (!row) {
    emptyEl.hidden = false;
    formEl.hidden = true;
    selectedRowSnapshot = null;
    resetNonExistingDraftModes();
    clearDryRunResult();
    if (titleEl) titleEl.textContent = "選択中の公演を編集";
    if (leadEl) leadEl.textContent = "一覧で選んだ公演の内容を変更します。";
    return;
  }

  emptyEl.hidden = true;
  formEl.hidden = false;

  const date = row.date ?? "";
  const month = monthFromDate(date);

  setFieldValue("gosaki-edit-date", date);
  setMonthHint("gosaki-edit-month-hint", date);
  setFieldValue("gosaki-edit-title", String(row.title ?? ""));
  setFieldValue("gosaki-edit-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-edit-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-edit-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-edit-price", String(row.price ?? ""));
  setFieldValue("gosaki-edit-description", String(row.description ?? ""));
  setCheckbox("gosaki-edit-published", row.published === true);
  setPreviewLink("gosaki-edit-preview-link", month);

  if (isDuplicateDraftMode()) {
    updateNewEventDraftBanner(null);
    updateUnpublishDraftBanner(null);
    if (titleEl) titleEl.textContent = "複製案を編集";
    if (leadEl) {
      leadEl.textContent =
        "複製案です。まだ保存されていません。内容を確認してから「変更を確認」を押してください。";
    }
    setEditFormUpdatedAt(null);
    setEditFormLegacyId(GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL);
    setEditFormFieldsReadOnly(false);
  } else if (isNewEventDraftMode()) {
    updateDuplicateDraftBanner(null);
    updateUnpublishDraftBanner(null);
    if (titleEl) titleEl.textContent = "新規追加案を編集";
    if (leadEl) {
      leadEl.textContent =
        "新規追加案です。まだ保存されていません。変更を確認すると、新規追加予定の内容を確認できます。";
    }
    setEditFormUpdatedAt(null);
    setEditFormLegacyId(GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL);
    setCheckbox("gosaki-edit-published", false);
    setEditFormFieldsReadOnly(false);
  } else if (isUnpublishDraftMode()) {
    updateDuplicateDraftBanner(null);
    updateNewEventDraftBanner(null);
    if (titleEl) titleEl.textContent = "非公開化案を確認";
    if (leadEl) {
      leadEl.textContent =
        "非公開化案です。まだ保存されていません。変更を確認すると、非公開化予定の内容を確認できます。";
    }
    setEditFormUpdatedAt(row.updated_at);
    setEditFormLegacyId(row.legacy_id ?? "—");
    setCheckbox("gosaki-edit-published", row.published === true);
    setEditFormFieldsReadOnly(true);
  } else {
    updateDuplicateDraftBanner(null);
    updateNewEventDraftBanner(null);
    updateUnpublishDraftBanner(null);
    setEditFormFieldsReadOnly(false);
    if (titleEl) titleEl.textContent = "選択中の公演を編集";
    if (leadEl) leadEl.textContent = "一覧で選んだ公演の内容を変更します。";
    setEditFormUpdatedAt(row.updated_at);
    setEditFormLegacyId(row.legacy_id ?? "—");
  }

  if (options?.clearDryRun !== false) {
    clearDryRunResult();
  }
  updateUnpublishButtonState();
}

function readEditFormSafeValues(): G9kExistingEventSaveButtonFormValues {
  const values = {} as G9kExistingEventSaveButtonFormValues;
  for (const field of G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS) {
    const el = document.getElementById(G9K2_EDIT_DRY_RUN_FIELD_IDS[field]) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    values[field] = el?.value ?? "";
  }
  return values;
}

function clearDryRunResult(): void {
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  lastNewEventDryRunResult = null;
  lastUnpublishDryRunResult = null;
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;
  el.hidden = true;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--saved",
  );
  el.innerHTML = "";
  updateSaveButtonState(null);
}

function showDryRunSavedState(): void {
  lastDryRunResult = null;
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;
  el.hidden = false;
  el.className = "gosaki-schedule-edit-dry-run gosaki-schedule-edit-dry-run--saved";
  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--saved">
      保存済み。この内容はデータベースに反映されています。再度保存するには内容を変更して「変更を確認」からやり直してください。
    </p>
  `;
  updateSaveButtonState(null);
}

function markDryRunStale(): void {
  if (!lastDryRunResult && !lastDuplicateDryRunResult && !lastNewEventDryRunResult && !lastSaveOutcome) return;
  clearSaveResult();
  lastSaveOutcome = null;
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el || el.hidden) return;
  el.classList.remove("gosaki-schedule-edit-dry-run--saved");
  el.classList.add("gosaki-schedule-edit-dry-run--stale");
  const staleNote = el.querySelector(".gosaki-schedule-edit-dry-run__stale-note");
  if (!staleNote) {
    const note = document.createElement("p");
    note.className = "gosaki-schedule-edit-dry-run__stale-note";
    note.setAttribute("role", "status");
    note.textContent = "内容が変わりました。再度「変更を確認」を押してください。";
    el.prepend(note);
  }
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  lastNewEventDryRunResult = null;
  updateSaveButtonState(null);
}

function renderGuardErrorList(errors: string[]): string {
  if (errors.length === 0) return "";
  const items = errors.map((message) => `<li>${escapeHtml(message)}</li>`).join("");
  return `<ul class="gosaki-schedule-edit-dry-run__guard-errors">${items}</ul>`;
}

function renderPayloadKeys(keys: string[]): string {
  if (keys.length === 0) {
    return '<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--empty">なし</span>';
  }
  return keys
    .map((key) => `<span class="gosaki-schedule-edit-dry-run__chip"><code>${escapeHtml(key)}</code></span>`)
    .join("");
}

function hasNewEventExistingScheduleId(): boolean {
  if (!newEventDraftState) return false;
  const id = String(newEventDraftState.draft.id ?? "").trim();
  return Boolean(id && id !== GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_UNSAVED_ID);
}

function hasNewEventDuplicateSourceId(): boolean {
  return Boolean(duplicateSourceSnapshot?.id);
}

function computeNewEventPlannedAllocationPreview(date: string): {
  legacy_id: string;
  sort_order: number;
  source_route: string;
  source_file: string;
} | null {
  const trimmed = date.trim();
  if (!trimmed) return null;
  try {
    const monthRows = scheduleRecordsToMonthAllocationRows(
      selectableRows.filter((row) => row.site_slug === STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
    );
    return computeG22ePlannedAllocation({ date: trimmed, monthRows });
  } catch {
    return null;
  }
}

function updateSaveButtonState(result: G9kExistingEventSaveButtonDryRunResult | null): void {
  const button = document.getElementById(
    "gosaki-schedule-update-btn",
  ) as HTMLButtonElement | null;
  if (!button) return;

  if (isUnpublishDraftMode()) {
    const gate = evaluateG22fUnpublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      unpublishMode: true,
      target: unpublishTargetSnapshot,
      unpublishDryRunResult: lastUnpublishDryRunResult,
    });

    button.disabled = !gate.enabled || saveInFlight;
    if (gate.enabled && !saveInFlight) {
      button.removeAttribute("data-gosaki-schedule-action-disabled");
      button.setAttribute("data-gosaki-save-allowed", "true");
      button.textContent = "非公開化を保存";
      button.title = gate.reason;
      setSaveButtonNote(gate.reason);
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "非公開化を保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "非公開化案です。「変更を確認」で内容を確認できます。保存は現在無効です。データベースからは削除しません。",
    );
    return;
  }

  if (isNewEventDraftMode()) {
    const gate = evaluateG22eNewEventInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      newEventMode: true,
      newEventDryRunResult: lastNewEventDryRunResult,
      hasExistingScheduleId: hasNewEventExistingScheduleId(),
      hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
    });

    button.disabled = !gate.enabled || saveInFlight;
    if (gate.enabled && !saveInFlight) {
      button.removeAttribute("data-gosaki-schedule-action-disabled");
      button.setAttribute("data-gosaki-save-allowed", "true");
      button.textContent = "新規追加を保存";
      button.title = gate.reason;
      setSaveButtonNote(gate.reason);
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "新規追加案です。「変更を確認」で内容を確認できます。保存は戸山が確認して反映します。",
    );
    return;
  }

  if (isDuplicateDraftMode()) {
    const gate = evaluateG22dDuplicateInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      duplicateMode: true,
      source: duplicateSourceSnapshot,
      duplicateDryRunResult: lastDuplicateDryRunResult,
    });

    button.disabled = !gate.enabled || saveInFlight;
    if (gate.enabled && !saveInFlight) {
      button.removeAttribute("data-gosaki-schedule-action-disabled");
      button.setAttribute("data-gosaki-save-allowed", "true");
      button.textContent = "複製案を保存";
      button.title = gate.reason;
      setSaveButtonNote(gate.reason);
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "複製案を保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "複製案です。「変更を確認」で内容を確認できます。保存は戸山が確認して反映します。",
    );
    return;
  }

  const gate = evaluateG9kOperatorSaveButtonUiGate({
    signedIn: stagingAuthSignedIn === true,
    selectedRow: selectedRowSnapshot,
    dryRunResult: result,
  });

  button.disabled = !gate.enabled || saveInFlight;
  if (gate.enabled && !saveInFlight) {
    button.removeAttribute("data-gosaki-schedule-action-disabled");
    button.setAttribute("data-gosaki-save-allowed", "true");
    button.title = "変更内容を保存します";
    button.textContent = "更新する";
    setSaveButtonNote(operatorSaveEnabledMessage());
    return;
  }

  button.setAttribute("data-gosaki-schedule-action-disabled", "");
  button.setAttribute("data-gosaki-save-allowed", "false");

  if (!result) {
    button.textContent = "更新する（準備中）";
    button.title = gate.reason;
    setSaveButtonNote(operatorSavePrepMessage());
    return;
  }

  if (result.saveReadiness === "ready_but_save_disabled" && result.ok) {
    button.textContent = "更新する（保存無効）";
    button.title = gate.reason;
    setSaveButtonNote(null);
    return;
  }

  button.textContent = "更新する（保存不可）";
  button.title = gate.reason;
  if (result.saveReadiness === "no_changes") {
    setSaveButtonNote("変更がありません。保存できません。");
  } else {
    setSaveButtonNote(gate.reason || "確認エラーがあります。保存できません。");
  }
}

function renderChangedFieldChips(changedFields: string[]): string {
  if (changedFields.length === 0) {
    return '<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--empty">なし</span>';
  }
  return changedFields
    .map((field) => {
      const label =
        G9K2_FIELD_LABELS[field as G9kExistingEventSaveButtonSafeField] ?? field;
      return `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(label)}</span>`;
    })
    .join("");
}

function renderBeforeAfterRows(
  result: G9kExistingEventSaveButtonDryRunResult,
): string {
  return result.changedFields
    .map((field) => {
      const label =
        G9K2_FIELD_LABELS[field as G9kExistingEventSaveButtonSafeField] ?? field;
      const before = displayDryRunValue(result.before[field as G9kExistingEventSaveButtonSafeField]);
      const after = displayDryRunValue(result.after[field as G9kExistingEventSaveButtonSafeField]);
      return `<tr>
        <th scope="row">${escapeHtml(label)}</th>
        <td class="gosaki-schedule-edit-dry-run__before">${escapeHtml(before)}</td>
        <td class="gosaki-schedule-edit-dry-run__after">${escapeHtml(after)}</td>
      </tr>`;
    })
    .join("");
}

function renderValidationWarningsList(warnings: string[]): string {
  if (warnings.length === 0) return "";
  const items = warnings.map((message) => `<li>${escapeHtml(message)}</li>`).join("");
  return `<ul class="gosaki-schedule-edit-dry-run__validation-warnings">${items}</ul>`;
}

function renderDuplicateDryRunDevDetails(result: G22bScheduleDuplicateDryRunResult): string {
  const insertConfig = getG22dDuplicateInsertConfig();
  const gate = evaluateG22dDuplicateInsertUiGate({
    signedIn: stagingAuthSignedIn === true,
    duplicateMode: isDuplicateDraftMode(),
    source: duplicateSourceSnapshot,
    duplicateDryRunResult: result.ok ? result : null,
  });

  return `
    <details class="gosaki-schedule-duplicate-dry-run-dev">
      <summary>開発者向け詳細</summary>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>phase</dt><dd><code>${escapeHtml(result.phase)}</code></dd></div>
        <div><dt>approvalId (dry-run)</dt><dd><code>${escapeHtml(result.approvalId)}</code></dd></div>
        <div><dt>insert approvalId</dt><dd><code>${escapeHtml(insertConfig.approvalId)}</code></dd></div>
        <div><dt>sourceId (fixed)</dt><dd><code>${escapeHtml(G22D_DUPLICATE_INSERT_SOURCE_ID)}</code></dd></div>
        <div><dt>planned legacy_id</dt><dd><code>${escapeHtml(G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID)}</code></dd></div>
        <div><dt>G-22d env arm</dt><dd><code>${escapeHtml(insertConfig.envArm)}=${insertConfig.armed ? "true" : "false"}</code></dd></div>
        <div><dt>insert saveEnabled</dt><dd><code>${String(insertConfig.saveEnabled)}</code></dd></div>
        <div><dt>insert saveAllowed (UI)</dt><dd><code>${String(gate.saveAllowed)}</code></dd></div>
        <div><dt>site_slug</dt><dd><code>${escapeHtml(String(result.payload.site_slug ?? "—"))}</code></dd></div>
      </dl>
      ${insertConfig.armFailureReason ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(insertConfig.armFailureReason)}</p>` : ""}
      <pre class="gosaki-schedule-duplicate-dry-run-dev__json">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>
    </details>
  `;
}

function renderNewEventDryRunDevDetails(result: G22eScheduleNewEventDryRunResult): string {
  const insertConfig = getG22eNewEventInsertConfig();
  const gate = evaluateG22eNewEventInsertUiGate({
    signedIn: stagingAuthSignedIn === true,
    newEventMode: isNewEventDraftMode(),
    newEventDryRunResult: result.ok ? result : null,
    hasExistingScheduleId: hasNewEventExistingScheduleId(),
    hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
  });
  const planned = computeNewEventPlannedAllocationPreview(String(result.payload.date ?? ""));

  return `
    <details class="gosaki-schedule-new-event-dry-run-dev">
      <summary>開発者向け詳細</summary>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>phase</dt><dd><code>${escapeHtml(result.phase)}</code></dd></div>
        <div><dt>approvalId (dry-run)</dt><dd><code>${escapeHtml(result.approvalId)}</code></dd></div>
        <div><dt>insert approvalId</dt><dd><code>${escapeHtml(insertConfig.approvalId)}</code></dd></div>
        <div><dt>G-22e env arm</dt><dd><code>${escapeHtml(insertConfig.envArm)}=${insertConfig.armed ? "true" : "false"}</code></dd></div>
        <div><dt>insert saveEnabled</dt><dd><code>${String(insertConfig.saveEnabled)}</code></dd></div>
        <div><dt>insert saveAllowed (UI)</dt><dd><code>${String(gate.saveAllowed)}</code></dd></div>
        <div><dt>planned legacy_id</dt><dd><code>${escapeHtml(planned?.legacy_id ?? "—")}</code></dd></div>
        <div><dt>planned sort_order</dt><dd><code>${escapeHtml(planned != null ? String(planned.sort_order) : "—")}</code></dd></div>
        <div><dt>planned source_route</dt><dd><code>${escapeHtml(planned?.source_route ?? "—")}</code></dd></div>
        <div><dt>planned source_file</dt><dd><code>${escapeHtml(planned?.source_file ?? "—")}</code></dd></div>
        <div><dt>site_slug</dt><dd><code>${escapeHtml(String(result.payload.site_slug ?? "—"))}</code></dd></div>
        <div><dt>published</dt><dd><code>false</code></dd></div>
        <div><dt>protected duplicate legacy_id</dt><dd><code>${escapeHtml(G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID)}</code> (non-touch)</dd></div>
      </dl>
      ${insertConfig.armFailureReason ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(insertConfig.armFailureReason)}</p>` : ""}
      <pre class="gosaki-schedule-new-event-dry-run-dev__json">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>
    </details>
  `;
}

function renderNewEventDryRunResult(result: G22eScheduleNewEventDryRunResult): void {
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--saved",
    "gosaki-schedule-edit-dry-run--duplicate",
    "gosaki-schedule-edit-dry-run--new",
  );

  updateSaveButtonState(null);

  if (!result.ok) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">新規追加案の確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">新規追加案を確認できませんでした。入力内容を確認してください。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存は現在無効です。</p>
      ${renderNewEventDryRunDevDetails(result)}
    `;
    return;
  }

  el.classList.add(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--new",
  );

  const month = result.derivedPreview?.recalculatedMonth ?? "—";
  const group = result.derivedPreview?.scheduleGroup ?? "—";
  const legacyLabel =
    result.payload.legacy_id == null ? GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL : String(result.payload.legacy_id);

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">新規追加案の確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    <p class="gosaki-schedule-edit-dry-run__note">
      まだ保存されていません。保存は戸山が確認して反映します。保存は現在無効です。
    </p>
    ${renderValidationWarningsList(result.validation.warnings)}
    ${result.validation.ok ? "" : renderGuardErrorList(result.guardErrors.filter((e) => !result.validation.warnings.includes(e)))}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div>
        <dt>操作</dt>
        <dd><code>new</code>（新規追加の予定）</dd>
      </div>
      <div>
        <dt>legacy_id</dt>
        <dd><code>${escapeHtml(legacyLabel)}</code></dd>
      </div>
      <div>
        <dt>追加予定の日付</dt>
        <dd>${escapeHtml(String(result.payload.date ?? "—"))}</dd>
      </div>
      <div>
        <dt>タイトル</dt>
        <dd>${escapeHtml(displayDryRunValue(String(result.payload.title ?? "")))}</dd>
      </div>
      <div>
        <dt>表示先の月</dt>
        <dd><code>${escapeHtml(String(month))}</code></dd>
      </div>
      <div>
        <dt>区分</dt>
        <dd>${escapeHtml(String(group))}</dd>
      </div>
      <div>
        <dt>published</dt>
        <dd><code>false</code></dd>
      </div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">payload keys</span>
      ${renderPayloadKeys(result.payloadKeys)}
    </div>
    <p class="gosaki-schedule-edit-dry-run__lock">
      安全確認:
      <code>dryRun=true</code>,
      <code>actualWrite=false</code>,
      <code>wouldInsert=${String(result.wouldInsert)}</code>,
      <code>saveAllowed=false</code>
    </p>
    ${renderNewEventDryRunDevDetails(result)}
  `;
}

function renderUnpublishDryRunDevDetails(result: G22fScheduleUnpublishDryRunResult): string {
  const updateConfig = getG22fUnpublishUpdateConfig();
  const gate = evaluateG22fUnpublishUpdateUiGate({
    signedIn: stagingAuthSignedIn === true,
    unpublishMode: isUnpublishDraftMode(),
    target: unpublishTargetSnapshot,
    unpublishDryRunResult: result.ok ? result : null,
  });
  const expectedBeforeUpdatedAt = unpublishTargetSnapshot?.updated_at ?? "—";

  return `
    <details class="gosaki-schedule-unpublish-dry-run-dev">
      <summary>開発者向け詳細</summary>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>phase</dt><dd><code>${escapeHtml(result.phase)}</code></dd></div>
        <div><dt>approvalId (dry-run)</dt><dd><code>${escapeHtml(result.approvalId)}</code></dd></div>
        <div><dt>unpublish update approvalId</dt><dd><code>${escapeHtml(updateConfig.approvalId)}</code></dd></div>
        <div><dt>operation</dt><dd><code>${escapeHtml(result.operation)}</code></dd></div>
        <div><dt>G-22f env arm</dt><dd><code>${escapeHtml(updateConfig.envArm)}=${updateConfig.armed ? "true" : "false"}</code></dd></div>
        <div><dt>update saveEnabled</dt><dd><code>${String(updateConfig.saveEnabled)}</code></dd></div>
        <div><dt>update saveAllowed (UI)</dt><dd><code>${String(gate.saveAllowed)}</code></dd></div>
        <div><dt>target id</dt><dd><code>${escapeHtml(result.target.id)}</code></dd></div>
        <div><dt>legacy_id</dt><dd><code>${escapeHtml(result.target.legacy_id ?? "—")}</code></dd></div>
        <div><dt>site_slug</dt><dd><code>${escapeHtml(result.target.site_slug)}</code></dd></div>
        <div><dt>before.published</dt><dd><code>${String(result.before.published)}</code></dd></div>
        <div><dt>after.published</dt><dd><code>false</code></dd></div>
        <div><dt>expectedBeforeUpdatedAt</dt><dd><code>${escapeHtml(String(expectedBeforeUpdatedAt))}</code></dd></div>
        <div><dt>wouldUpdate</dt><dd><code>${String(result.wouldUpdate)}</code></dd></div>
        <div><dt>wouldDelete</dt><dd><code>false</code></dd></div>
        <div><dt>physicalDelete</dt><dd><code>false</code></dd></div>
        <div><dt>dry-run saveAllowed</dt><dd><code>false</code></dd></div>
        <div><dt>protected ${escapeHtml(G22F_PROTECTED_LEGACY_SCHEDULE_2026_03_014)}</dt><dd><code>non-touch</code></dd></div>
        <div><dt>protected ${escapeHtml(G22F_PROTECTED_LEGACY_SCHEDULE_2026_09_001)}</dt><dd><code>non-touch</code></dd></div>
      </dl>
      ${updateConfig.armFailureReason ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(updateConfig.armFailureReason)}</p>` : ""}
      <pre class="gosaki-schedule-unpublish-dry-run-dev__json">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>
    </details>
  `;
}

function renderUnpublishDryRunResult(result: G22fScheduleUnpublishDryRunResult): void {
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--saved",
    "gosaki-schedule-edit-dry-run--duplicate",
    "gosaki-schedule-edit-dry-run--new",
    "gosaki-schedule-edit-dry-run--unpublish",
  );

  updateSaveButtonState(null);

  if (!result.ok) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">非公開化案の確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">非公開化案を確認できませんでした。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。行は削除しません。保存は現在無効です。</p>
      ${renderUnpublishDryRunDevDetails(result)}
    `;
    return;
  }

  el.classList.add(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--unpublish",
  );

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">非公開化案の確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    <p class="gosaki-schedule-edit-dry-run__note">
      まだ保存されていません。データベースからは削除しません。保存は現在無効です。
    </p>
    ${renderValidationWarningsList(result.validation.warnings)}
    ${result.validation.ok ? "" : renderGuardErrorList(result.guardErrors)}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div>
        <dt>操作</dt>
        <dd><code>unpublish</code>（非公開化の予定）</dd>
      </div>
      <div>
        <dt>対象 id</dt>
        <dd><code>${escapeHtml(result.target.id)}</code></dd>
      </div>
      <div>
        <dt>legacy_id</dt>
        <dd><code>${escapeHtml(result.target.legacy_id ?? "—")}</code></dd>
      </div>
      <div>
        <dt>タイトル</dt>
        <dd>${escapeHtml(displayDryRunValue(result.target.title))}</dd>
      </div>
      <div>
        <dt>日付</dt>
        <dd>${escapeHtml(result.target.date)}</dd>
      </div>
      <div>
        <dt>site_slug</dt>
        <dd><code>${escapeHtml(result.target.site_slug)}</code></dd>
      </div>
      <div>
        <dt>published（変更前 → 変更後）</dt>
        <dd><code>true</code> → <code>false</code></dd>
      </div>
      <div>
        <dt>physicalDelete</dt>
        <dd><code>false</code></dd>
      </div>
    </dl>
    <p class="gosaki-schedule-edit-dry-run__lock">
      安全確認:
      <code>dryRun=true</code>,
      <code>actualWrite=false</code>,
      <code>wouldUpdate=${String(result.wouldUpdate)}</code>,
      <code>wouldDelete=false</code>,
      <code>saveAllowed=false</code>
    </p>
    ${renderUnpublishDryRunDevDetails(result)}
  `;
}

function renderDuplicateDryRunResult(result: G22bScheduleDuplicateDryRunResult): void {
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--saved",
    "gosaki-schedule-edit-dry-run--new",
  );

  updateSaveButtonState(null);

  if (!result.ok) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">複製案の確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">複製案を確認できませんでした。入力内容を確認してください。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存はまだ実行されません。</p>
      ${renderDuplicateDryRunDevDetails(result)}
    `;
    return;
  }

  el.classList.add(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--duplicate",
  );

  const month = result.derivedPreview?.recalculatedMonth ?? "—";
  const group = result.derivedPreview?.scheduleGroup ?? "—";

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">複製案の確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    <p class="gosaki-schedule-edit-dry-run__note">
      まだ保存されていません。保存は戸山が確認して反映します。
    </p>
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div>
        <dt>操作</dt>
        <dd><code>duplicate</code>（新規追加の予定）</dd>
      </div>
      <div>
        <dt>複製元</dt>
        <dd>${escapeHtml(displayValue(result.source.title))}</dd>
      </div>
      <div>
        <dt>複製元 ID</dt>
        <dd><code>${escapeHtml(result.source.id)}</code></dd>
      </div>
      <div>
        <dt>複製元 legacy_id</dt>
        <dd><code>${escapeHtml(result.source.legacy_id ?? "—")}</code></dd>
      </div>
      <div>
        <dt>追加予定の日付</dt>
        <dd>${escapeHtml(String(result.payload.date ?? "—"))}</dd>
      </div>
      <div>
        <dt>表示先の月</dt>
        <dd><code>${escapeHtml(String(month))}</code></dd>
      </div>
      <div>
        <dt>区分</dt>
        <dd>${escapeHtml(String(group))}</dd>
      </div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">payload keys</span>
      ${renderPayloadKeys(result.payloadKeys)}
    </div>
    <p class="gosaki-schedule-edit-dry-run__lock">
      安全確認:
      <code>dryRun=true</code>,
      <code>actualWrite=false</code>,
      <code>wouldInsert=${String(result.wouldInsert)}</code>,
      <code>saveAllowed=false</code>
    </p>
    ${renderDuplicateDryRunDevDetails(result)}
  `;
}

function renderDryRunResult(result: G9kExistingEventSaveButtonDryRunResult): void {
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
  );

  updateSaveButtonState(result);

  const noChanges = result.saveReadiness === "no_changes";
  const hasGuardFailure = !result.ok && result.guardErrors.length > 0;

  if (noChanges) {
    el.classList.add("gosaki-schedule-edit-dry-run--empty");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">変更された項目はありません。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存はできません。</p>
    `;
    return;
  }

  if (hasGuardFailure) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">確認できませんでした。入力内容を確認してください。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存はまだ実行されません。</p>
    `;
    return;
  }

  el.classList.add("gosaki-schedule-edit-dry-run--ok", "gosaki-schedule-edit-dry-run--ready");
  const saveReadyMessage =
    result.saveReadiness === "ready_to_save"
      ? "保存準備OK。更新できます"
      : operatorSaveDisabledDryRunCompleteMessage();
  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(saveReadyMessage)}
    </p>
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div>
        <dt>対象公演</dt>
        <dd>${escapeHtml(displayValue(result.target.title))}</dd>
      </div>
      <div>
        <dt>日付</dt>
        <dd>${escapeHtml(result.target.date || "—")}</dd>
      </div>
      <div class="gosaki-schedule-edit-dry-run__target-id">
        <dt>ID</dt>
        <dd><code>${escapeHtml(result.target.id)}</code></dd>
      </div>
      <div>
        <dt>approvalId</dt>
        <dd><code>${escapeHtml(result.approvalId)}</code></dd>
      </div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span>
      ${renderChangedFieldChips(result.changedFields)}
    </div>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">payload keys</span>
      ${renderPayloadKeys(result.payloadKeys)}
    </div>
    <div class="gosaki-schedule-edit-dry-run__diff-wrap">
      <table class="gosaki-schedule-edit-dry-run__diff">
        <thead>
          <tr>
            <th scope="col">項目</th>
            <th scope="col">変更前</th>
            <th scope="col">変更後</th>
          </tr>
        </thead>
        <tbody>
          ${renderBeforeAfterRows(result)}
        </tbody>
      </table>
    </div>
    <p class="gosaki-schedule-edit-dry-run__lock">
      安全確認: <code>expectedBeforeUpdatedAt</code> = ${escapeHtml(result.expectedBeforeUpdatedAt ?? "—")}
      （rowsAffected 必須 = ${String(result.rowsAffectedRequired)}）
    </p>
    ${renderDryRunOutcomeNote(result.saveReadiness)}
  `;
}

function renderSaveDiffRows(
  diff: NonNullable<G9kExistingEventSaveButtonSaveOutcome["beforeAfterDiff"]>,
): string {
  return diff
    .map((row) => {
      const label = G9K2_FIELD_LABELS[row.field as G9kExistingEventSaveButtonSafeField] ?? row.field;
      return `<tr>
        <th scope="row">${escapeHtml(label)}</th>
        <td class="gosaki-schedule-edit-dry-run__before">${escapeHtml(displayDryRunValue(row.before))}</td>
        <td class="gosaki-schedule-edit-dry-run__after">${escapeHtml(displayDryRunValue(row.after))}</td>
      </tr>`;
    })
    .join("");
}

function renderSaveResult(outcome: G9kExistingEventSaveButtonSaveOutcome): void {
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;

  lastSaveOutcome = outcome;
  el.hidden = false;
  const success = isG9kSaveOutcomeSuccess(outcome);
  el.className = `gosaki-schedule-edit-save-result${success ? " gosaki-schedule-edit-save-result--ok" : " gosaki-schedule-edit-save-result--error"}`;

  const changedChips = renderChangedFieldChips(outcome.changedFields);
  const payloadChips = renderPayloadKeys(outcome.payloadKeys);
  const diffRows = outcome.beforeAfterDiff ? renderSaveDiffRows(outcome.beforeAfterDiff) : "";
  const rowsAffected =
    success && outcome.result && !("errorCode" in outcome.result)
      ? String(outcome.result.rowsAffected ?? "—")
      : "—";
  const postSaveDescription = displayValue(
    outcome.afterRecord?.description ??
      outcome.beforeAfterDiff?.find((row) => row.field === "description")?.after,
  );

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "保存成功" : "保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの更新が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>rowsAffected</dt><dd><code>${escapeHtml(rowsAffected)}</code></dd></div>
      <div><dt>target id</dt><dd><code>${escapeHtml(outcome.beforeRecord?.id ?? "—")}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(outcome.beforeRecord?.legacy_id ?? "—")}</code></dd></div>
      <div><dt>title</dt><dd>${escapeHtml(displayValue(outcome.afterRecord?.title ?? outcome.beforeRecord?.title))}</dd></div>
      <div><dt>date</dt><dd>${escapeHtml(outcome.beforeRecord?.date ?? "—")}</dd></div>
      <div><dt>venue</dt><dd>${escapeHtml(displayValue(outcome.afterRecord?.venue ?? outcome.beforeRecord?.venue))}</dd></div>
      <div><dt>before updated_at</dt><dd><code>${escapeHtml(outcome.beforeRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>post-save updated_at</dt><dd><code>${escapeHtml(outcome.afterRecord?.updated_at ?? "—")}</code></dd></div>
      <div class="gosaki-schedule-edit-save-result__description"><dt>post-save description</dt><dd class="gosaki-schedule-edit-save-result__description-body">${escapeHtml(postSaveDescription)}</dd></div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span>
      ${changedChips}
    </div>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">payload keys</span>
      ${payloadChips}
    </div>
    ${
      diffRows
        ? `<div class="gosaki-schedule-edit-dry-run__diff-wrap"><table class="gosaki-schedule-edit-dry-run__diff"><thead><tr><th>項目</th><th>変更前</th><th>変更後</th></tr></thead><tbody>${diffRows}</tbody></table></div>`
        : ""
    }
  `;
}

function isG22eInsertOutcomeSuccess(outcome: G22eNewEventInsertSaveOutcome): boolean {
  return outcome.ok === true && outcome.actualWrite === true && Boolean(outcome.insertedId);
}

function renderNewEventInsertSaveResult(outcome: G22eNewEventInsertSaveOutcome): void {
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;

  el.hidden = false;
  const success = isG22eInsertOutcomeSuccess(outcome);
  el.className = `gosaki-schedule-edit-save-result${success ? " gosaki-schedule-edit-save-result--ok" : " gosaki-schedule-edit-save-result--error"}`;

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "新規追加案の保存成功" : "新規追加案を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの追加（INSERT）が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>operation</dt><dd><code>${escapeHtml(outcome.operation)}</code></dd></div>
      <div><dt>approvalId</dt><dd><code>${escapeHtml(outcome.approvalId)}</code></dd></div>
      <div><dt>insertedId</dt><dd><code>${escapeHtml(outcome.insertedId ?? "—")}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(outcome.legacy_id ?? "—")}</code></dd></div>
      <div><dt>sort_order</dt><dd><code>${escapeHtml(outcome.sort_order != null ? String(outcome.sort_order) : "—")}</code></dd></div>
      <div><dt>source_route</dt><dd><code>${escapeHtml(outcome.source_route ?? "—")}</code></dd></div>
      <div><dt>source_file</dt><dd><code>${escapeHtml(outcome.source_file ?? "—")}</code></dd></div>
      <div><dt>actualWrite</dt><dd><code>${String(outcome.actualWrite)}</code></dd></div>
    </dl>
    ${
      outcome.guardReasons.length > 0
        ? `<div class="gosaki-schedule-edit-dry-run__chips"><span class="gosaki-schedule-edit-dry-run__chips-label">guardReasons</span>${outcome.guardReasons.map((reason) => `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(reason)}</span>`).join("")}</div>`
        : ""
    }
    ${outcome.rollbackHint ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(outcome.rollbackHint)}</p>` : ""}
  `;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function isG22dInsertOutcomeSuccess(outcome: G22dDuplicateInsertSaveOutcome): boolean {
  return outcome.ok === true && outcome.actualWrite === true && Boolean(outcome.insertedId);
}

function renderDuplicateInsertSaveResult(outcome: G22dDuplicateInsertSaveOutcome): void {
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;

  el.hidden = false;
  const success = isG22dInsertOutcomeSuccess(outcome);
  el.className = `gosaki-schedule-edit-save-result${success ? " gosaki-schedule-edit-save-result--ok" : " gosaki-schedule-edit-save-result--error"}`;

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "複製案の保存成功" : "複製案を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの追加（INSERT）が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>operation</dt><dd><code>${escapeHtml(outcome.operation)}</code></dd></div>
      <div><dt>approvalId</dt><dd><code>${escapeHtml(outcome.approvalId)}</code></dd></div>
      <div><dt>sourceId</dt><dd><code>${escapeHtml(outcome.sourceId)}</code></dd></div>
      <div><dt>insertedId</dt><dd><code>${escapeHtml(outcome.insertedId ?? "—")}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(outcome.legacy_id ?? "—")}</code></dd></div>
      <div><dt>actualWrite</dt><dd><code>${String(outcome.actualWrite)}</code></dd></div>
    </dl>
    ${
      outcome.guardReasons.length > 0
        ? `<div class="gosaki-schedule-edit-dry-run__chips"><span class="gosaki-schedule-edit-dry-run__chips-label">guardReasons</span>${outcome.guardReasons.map((reason) => `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(reason)}</span>`).join("")}</div>`
        : ""
    }
    ${outcome.rollbackHint ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(outcome.rollbackHint)}</p>` : ""}
  `;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function isG22fUnpublishUpdateOutcomeSuccess(outcome: G22fUnpublishUpdateSaveOutcome): boolean {
  return outcome.ok === true && outcome.actualWrite === true && outcome.operation === "unpublish-update";
}

function renderUnpublishUpdateSaveResult(outcome: G22fUnpublishUpdateSaveOutcome): void {
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;

  el.hidden = false;
  const success = isG22fUnpublishUpdateOutcomeSuccess(outcome);
  el.className = `gosaki-schedule-edit-save-result${success ? " gosaki-schedule-edit-save-result--ok" : " gosaki-schedule-edit-save-result--error"}`;

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "非公開化の保存成功" : "非公開化を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースの published を false に更新しました（物理削除は行っていません）。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>operation</dt><dd><code>${escapeHtml(outcome.operation)}</code></dd></div>
      <div><dt>approvalId</dt><dd><code>${escapeHtml(outcome.approvalId)}</code></dd></div>
      <div><dt>targetId</dt><dd><code>${escapeHtml(outcome.targetId)}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(outcome.targetLegacyId ?? "—")}</code></dd></div>
      <div><dt>before published</dt><dd><code>${escapeHtml(String(outcome.beforeRecord?.published ?? "—"))}</code></dd></div>
      <div><dt>after published</dt><dd><code>${escapeHtml(String(outcome.afterRecord?.published ?? "—"))}</code></dd></div>
      <div><dt>expectedBeforeUpdatedAt</dt><dd><code>${escapeHtml(outcome.expectedBeforeUpdatedAt ?? "—")}</code></dd></div>
      <div><dt>wouldDelete</dt><dd><code>false</code></dd></div>
      <div><dt>physicalDelete</dt><dd><code>false</code></dd></div>
      <div><dt>actualWrite</dt><dd><code>${String(outcome.actualWrite)}</code></dd></div>
    </dl>
    ${
      outcome.guardReasons.length > 0
        ? `<div class="gosaki-schedule-edit-dry-run__chips"><span class="gosaki-schedule-edit-dry-run__chips-label">guardReasons</span>${outcome.guardReasons.map((reason) => `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(reason)}</span>`).join("")}</div>`
        : ""
    }
    ${outcome.rollbackHint ? `<p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(outcome.rollbackHint)}</p>` : ""}
  `;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearSaveResult(): void {
  lastSaveOutcome = null;
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;
  el.hidden = true;
  el.className = "gosaki-schedule-edit-save-result";
  el.innerHTML = "";
}

function applyPostSaveSuccessState(outcome: G9kExistingEventSaveButtonSaveOutcome): void {
  if (!outcome.afterRecord || !outcome.result || "errorCode" in outcome.result) return;

  const writeResult = outcome.result;
  const updatedRow: ScheduleRecord = {
    ...selectedRowSnapshot!,
    ...(writeResult.afterSnapshot ?? {}),
    description:
      outcome.afterRecord.description ??
      writeResult.afterSnapshot?.description ??
      selectedRowSnapshot?.description,
    updated_at: outcome.afterRecord.updated_at,
  };
  selectedRowSnapshot = updatedRow;
  const index = selectableRows.findIndex((row) => row.id === updatedRow.id);
  if (index >= 0) selectableRows[index] = updatedRow;
  renderScheduleList();
  renderEditForm(updatedRow, { clearDryRun: false });
  setEditFormUpdatedAt(updatedRow.updated_at);
  showDryRunSavedState();
  renderSaveResult(outcome);
  const saveResultEl = document.getElementById("gosaki-schedule-edit-save-result");
  saveResultEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function refreshStagingAuthSignedIn(): Promise<boolean> {
  stagingAuthSignedIn = await resolveStagingAuthSignedIn();
  updateSaveButtonState(lastDryRunResult);
  return stagingAuthSignedIn;
}

async function resolveStagingAuthSignedIn(): Promise<boolean> {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return false;
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    return isSignedInStagingAuth(auth);
  } catch {
    return false;
  }
}

async function runEditDryRunPreview(): Promise<void> {
  if (isNewEventDraftMode()) {
    const signedIn = await refreshStagingAuthSignedIn();
    const result = executeG22eScheduleNewEventDryRun({
      formValues: readEditFormSafeValues(),
      date: readEditFormDate(),
      published: false,
      signedIn,
      supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
    });
    lastNewEventDryRunResult = result;
    lastDryRunResult = null;
    lastDuplicateDryRunResult = null;
    lastUnpublishDryRunResult = null;
    renderNewEventDryRunResult(result);
    return;
  }

  if (isUnpublishDraftMode()) {
    if (!unpublishTargetSnapshot) {
      window.alert("非公開化対象の公演が見つかりません。再度「非公開化案を作成」を押してください。");
      return;
    }

    const signedIn = await refreshStagingAuthSignedIn();
    const result = executeG22fScheduleUnpublishDryRun({
      target: unpublishTargetSnapshot,
      signedIn,
      supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
    });
    lastUnpublishDryRunResult = result;
    lastDryRunResult = null;
    lastDuplicateDryRunResult = null;
    lastNewEventDryRunResult = null;
    renderUnpublishDryRunResult(result);
    return;
  }

  if (isDuplicateDraftMode()) {
    if (!duplicateSourceSnapshot) {
      window.alert("複製元の公演が見つかりません。再度「複製」を押してください。");
      return;
    }

    const signedIn = await refreshStagingAuthSignedIn();
    const result = executeG22bScheduleDuplicateDryRun({
      source: duplicateSourceSnapshot,
      formValues: readEditFormSafeValues(),
      date: readEditFormDate(),
      published: readEditFormPublished(),
      signedIn,
      supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
    });
    lastDuplicateDryRunResult = result;
    lastDryRunResult = null;
    lastUnpublishDryRunResult = null;
    renderDuplicateDryRunResult(result);
    return;
  }

  if (!selectedRowSnapshot) {
    const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
    if (!el) return;
    el.hidden = false;
    el.className = "gosaki-schedule-edit-dry-run gosaki-schedule-edit-dry-run--error";
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">先に一覧から編集する公演を選んでください。</p>
    `;
    updateSaveButtonState(null);
    return;
  }

  const signedIn = await refreshStagingAuthSignedIn();
  const result = executeG9kExistingEventSaveButtonDryRun({
    beforeSnapshot: selectedRowSnapshot,
    formValues: readEditFormSafeValues(),
    signedIn,
    supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
  });
  lastDryRunResult = result;
  renderDryRunResult(result);
}

async function runEditSave(): Promise<void> {
  if (isUnpublishDraftMode()) {
    const gate = evaluateG22fUnpublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      unpublishMode: true,
      target: unpublishTargetSnapshot,
      unpublishDryRunResult: lastUnpublishDryRunResult,
    });
    if (!gate.enabled) {
      window.alert(gate.reason);
      return;
    }
    if (!unpublishTargetSnapshot || !lastUnpublishDryRunResult?.ok) {
      window.alert("先に「変更を確認」で非公開化案の dry-run を成功させてください。");
      return;
    }
    if (
      !window.confirm(
        "この公演を非公開にします（published=false）。1行のみ更新します。よろしいですか？",
      )
    ) {
      return;
    }

    saveInFlight = true;
    updateSaveButtonState(null);

    const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
    const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
    const outcome = await executeG22fScheduleUnpublishUpdateSave({
      url,
      anonKey,
      target: unpublishTargetSnapshot,
      unpublishMode: true,
      unpublishDryRunOk: lastUnpublishDryRunResult.ok,
      unpublishDryRunOperation: lastUnpublishDryRunResult.operation,
      wouldUpdate: lastUnpublishDryRunResult.wouldUpdate,
      wouldDelete: lastUnpublishDryRunResult.wouldDelete,
      physicalDelete: lastUnpublishDryRunResult.physicalDelete,
      beforePublished: lastUnpublishDryRunResult.before.published,
      afterPublished: lastUnpublishDryRunResult.after.published,
      duplicateMode: false,
      newEventMode: false,
      existingUpdateMode: false,
      expectedBeforeUpdatedAt: unpublishTargetSnapshot.updated_at ?? null,
    });

    saveInFlight = false;
    renderUnpublishUpdateSaveResult(outcome);
    updateSaveButtonState(null);
    return;
  }

  if (isNewEventDraftMode()) {
    const gate = evaluateG22eNewEventInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      newEventMode: true,
      newEventDryRunResult: lastNewEventDryRunResult,
      hasExistingScheduleId: hasNewEventExistingScheduleId(),
      hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
    });
    if (!gate.enabled) {
      window.alert(gate.reason);
      return;
    }
    if (!lastNewEventDryRunResult?.ok) {
      window.alert("先に「変更を確認」で新規追加案の dry-run を成功させてください。");
      return;
    }
    if (
      !window.confirm(
        "この新規追加案を1件だけ保存します。よろしいですか？（INSERTのみ）",
      )
    ) {
      return;
    }

    saveInFlight = true;
    updateSaveButtonState(null);

    const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
    const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
    const outcome = await executeG22eScheduleNewEventInsertSave({
      url,
      anonKey,
      formValues: readEditFormSafeValues(),
      date: readEditFormDate(),
      newEventMode: true,
      newEventDryRunOk: lastNewEventDryRunResult.ok,
      newEventDryRunOperation: lastNewEventDryRunResult.operation,
      hasExistingScheduleId: hasNewEventExistingScheduleId(),
      hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
    });

    saveInFlight = false;
    renderNewEventInsertSaveResult(outcome);
    updateSaveButtonState(null);
    return;
  }

  if (isDuplicateDraftMode()) {
    const gate = evaluateG22dDuplicateInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      duplicateMode: true,
      source: duplicateSourceSnapshot,
      duplicateDryRunResult: lastDuplicateDryRunResult,
    });
    if (!gate.enabled) {
      window.alert(gate.reason);
      return;
    }
    if (!duplicateSourceSnapshot || !lastDuplicateDryRunResult?.ok) {
      window.alert("先に「変更を確認」で複製案の dry-run を成功させてください。");
      return;
    }
    if (
      !window.confirm(
        "この複製案を1件だけ追加します。よろしいですか？（INSERTのみ・source行は変更しません）",
      )
    ) {
      return;
    }

    saveInFlight = true;
    updateSaveButtonState(null);

    const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
    const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
    const outcome = await executeG22dScheduleDuplicateInsertSave({
      url,
      anonKey,
      source: duplicateSourceSnapshot,
      formValues: readEditFormSafeValues(),
      date: readEditFormDate(),
      duplicateMode: true,
      duplicateDryRunOk: lastDuplicateDryRunResult.ok,
    });

    saveInFlight = false;
    renderDuplicateInsertSaveResult(outcome);
    updateSaveButtonState(null);
    return;
  }

  const config = getG9kExistingEventSaveButtonConfig();
  if (!config.saveEnabled) {
    const pageConfig = readG9kSaveButtonPageConfigFromDom();
    if (!pageConfig?.saveButtonSaveEnabled) {
      window.alert(
        "保存は無効です。開発用の Save 有効化が必要です（G-9k4 相当の env stack）。",
      );
      return;
    }
    window.alert(config.armFailureReason ?? "G-9k Save env arm / approval stack が未設定です。");
    return;
  }

  if (!selectedRowSnapshot || !lastDryRunResult?.ok) {
    window.alert("先に「変更を確認」で dry-run を成功させてください。");
    return;
  }

  const gate = evaluateG9kOperatorSaveButtonUiGate({
    signedIn: stagingAuthSignedIn === true,
    selectedRow: selectedRowSnapshot,
    dryRunResult: lastDryRunResult,
  });
  if (!gate.enabled) {
    window.alert(gate.reason);
    return;
  }

  if (
    !window.confirm(
      "この内容で既存公演を更新します。よろしいですか？（1行のみ更新）",
    )
  ) {
    return;
  }

  saveInFlight = true;
  updateSaveButtonState(lastDryRunResult);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const outcome = await executeG9kExistingEventSaveButtonSave({
    url,
    anonKey,
    beforeSnapshot: selectedRowSnapshot,
    formValues: readEditFormSafeValues(),
    saveBinding: {
      changedFields: [...lastDryRunResult.changedFields],
      payloadKeys: [...lastDryRunResult.payloadKeys],
      expectedBeforeUpdatedAt: lastDryRunResult.expectedBeforeUpdatedAt,
      dryRunOk: lastDryRunResult.ok,
    },
  });

  saveInFlight = false;

  if (isG9kSaveOutcomeSuccess(outcome)) {
    applyPostSaveSuccessState(outcome);
    return;
  }

  renderSaveResult(outcome);
  updateSaveButtonState(lastDryRunResult);
}

function renderScheduleRowButton(rowId: string, selected: boolean): string {
  return `<button type="button" class="admin-button admin-button--secondary admin-gosaki-schedule-select-btn" data-select-row-id="${escapeHtml(rowId)}">${selected ? "選択中" : "編集する"}</button>`;
}

function renderScheduleList(): void {
  const filtered = selectableRows.filter(rowMatchesFilters);
  const countEl = document.getElementById("gosaki-schedule-operator-filtered-count");
  if (countEl) countEl.textContent = String(filtered.length);

  const tbody = document.getElementById("gosaki-schedule-operator-table-body");
  const cardList = document.getElementById("gosaki-schedule-operator-card-list");

  if (filtered.length === 0) {
    const emptyMessage =
      '<tr><td colspan="7" class="admin-gosaki-schedule-table__empty">該当する公演はありません。</td></tr>';
    if (tbody) tbody.innerHTML = emptyMessage;
    if (cardList) {
      cardList.innerHTML =
        '<li class="gosaki-schedule-admin-card-list__empty">該当する公演はありません。</li>';
    }
    return;
  }

  if (tbody) {
    tbody.innerHTML = filtered
      .map((row) => {
        const selected = selectedRowId === row.id;
        return `<tr class="admin-gosaki-schedule-table__row${selected ? " is-selected" : ""}" data-row-id="${escapeHtml(row.id)}">
        <td>${escapeHtml(row.date)}</td>
        <td class="admin-gosaki-schedule-table__title-col">${escapeHtml(displayValue(row.title))}</td>
        <td>${escapeHtml(displayValue(row.venue))}</td>
        <td>${escapeHtml(displayValue(row.open_time))}</td>
        <td>${escapeHtml(displayValue(row.start_time))}</td>
        <td>${escapeHtml(displayValue(row.price))}</td>
        <td class="admin-gosaki-schedule-table__actions-col">${renderScheduleRowButton(row.id, selected)}</td>
      </tr>`;
      })
      .join("");
  }

  if (cardList) {
    cardList.innerHTML = filtered
      .map((row) => {
        const selected = selectedRowId === row.id;
        const published = row.published === true;
        return `<li class="gosaki-schedule-admin-card${selected ? " is-selected" : ""}" data-row-id="${escapeHtml(row.id)}">
        <div class="gosaki-schedule-admin-card__head">
          <time class="gosaki-schedule-admin-card__date" datetime="${escapeHtml(row.date)}">${escapeHtml(row.date)}</time>
          <span class="gosaki-schedule-admin-card__status gosaki-schedule-admin-card__status--${published ? "published" : "draft"}">${published ? "公開" : "非公開"}</span>
        </div>
        <p class="gosaki-schedule-admin-card__title">${escapeHtml(displayValue(row.title))}</p>
        <p class="gosaki-schedule-admin-card__venue">${escapeHtml(displayValue(row.venue))}</p>
        <p class="gosaki-schedule-admin-card__times">${escapeHtml(formatTimes(row))}</p>
        <p class="gosaki-schedule-admin-card__price">${escapeHtml(formatPriceLabel(row.price))}</p>
        <div class="gosaki-schedule-admin-card__actions">
          ${renderScheduleRowButton(row.id, selected)}
        </div>
      </li>`;
      })
      .join("");
  }
}

function selectRowById(rowId: string): void {
  const row = selectableRows.find((r) => r.id === rowId);
  if (!row) return;
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) return;
  if (isPocAuditScheduleRow(row)) return;

  if (isNewEventDraftMode()) {
    if (
      !window.confirm(
        "新規追加案の編集をやめて、別の公演を選び直しますか？（新規追加案は保存されません）",
      )
    ) {
      return;
    }
    resetNewEventDraftMode();
  }

  if (isUnpublishDraftMode()) {
    if (rowId === unpublishTargetSnapshot?.id) {
      selectedRowId = rowId;
      renderScheduleList();
      updateUnpublishButtonState();
      return;
    }
    if (
      !window.confirm(
        "非公開化案の編集をやめて、別の公演を選び直しますか？（非公開化案は保存されません）",
      )
    ) {
      return;
    }
    resetUnpublishDraftMode();
  }

  if (isDuplicateDraftMode() && rowId === duplicateSourceSnapshot?.id) {
    selectedRowId = rowId;
    renderScheduleList();
    return;
  }

  if (isDuplicateDraftMode() && rowId !== duplicateSourceSnapshot?.id) {
    if (
      !window.confirm(
        "複製案の編集をやめて、別の公演を選び直しますか？（複製案は保存されません）",
      )
    ) {
      return;
    }
    resetDuplicateDraftMode();
  }

  if (!confirmDiscardDirtyCandidateIfNeeded(rowId)) return;

  selectedRowId = rowId;
  selectedRowSnapshot = { ...row };
  editDraftMode = "existing";
  renderScheduleList();
  renderEditForm(row);
  dispatchRowSelected(row);
  updateUnpublishButtonState();

  const editCard = document.getElementById("gosaki-schedule-operator-edit");
  editCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function wireFilters(): void {
  const month = document.getElementById("gosaki-schedule-operator-month-filter");
  const published = document.getElementById("gosaki-schedule-operator-published-filter");
  const keyword = document.getElementById("gosaki-schedule-operator-keyword");

  month?.addEventListener("change", () => renderScheduleList());
  published?.addEventListener("change", () => renderScheduleList());
  keyword?.addEventListener("input", () => renderScheduleList());
}

function wireListActions(): void {
  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-select-row-id]");
    if (!button) return;
    const rowId = button.dataset.selectRowId;
    if (rowId) selectRowById(rowId);
  };

  document.getElementById("gosaki-schedule-operator-table-body")?.addEventListener("click", handleClick);
  document.getElementById("gosaki-schedule-operator-card-list")?.addEventListener("click", handleClick);
}

function wireTableActions(): void {
  wireListActions();
}

function wireAddForm(): void {
  const dateInput = document.getElementById("gosaki-add-date") as HTMLInputElement | null;
  const duplicateSelect = document.getElementById(
    "gosaki-add-duplicate-source",
  ) as HTMLSelectElement | null;

  const syncAddDateDerived = () => {
    const date = dateInput?.value ?? "";
    const month = monthFromDate(date);
    setMonthHint("gosaki-add-month-hint", date);
    setPreviewLink("gosaki-add-preview-link", month);
  };

  dateInput?.addEventListener("change", syncAddDateDerived);
  dateInput?.addEventListener("input", syncAddDateDerived);

  duplicateSelect?.addEventListener("change", () => {
    const rowId = duplicateSelect.value;
    if (!rowId) return;
    const row = selectableRows.find((r) => r.id === rowId);
    if (row) populateAddFormFromRow(row);
  });

  syncAddDateDerived();
}

function wireEditForm(): void {
  const dateInput = document.getElementById("gosaki-edit-date") as HTMLInputElement | null;
  const syncEditDateDerived = () => {
    const date = dateInput?.value ?? "";
    const month = monthFromDate(date);
    setMonthHint("gosaki-edit-month-hint", date);
    setPreviewLink("gosaki-edit-preview-link", month);
    markDryRunStale();
  };
  dateInput?.addEventListener("change", syncEditDateDerived);
  dateInput?.addEventListener("input", syncEditDateDerived);

  document
    .getElementById("gosaki-schedule-edit-dry-run-btn")
    ?.addEventListener("click", () => {
      void runEditDryRunPreview();
    });

  for (const field of G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS) {
    const el = document.getElementById(G9K2_EDIT_DRY_RUN_FIELD_IDS[field]);
    el?.addEventListener("input", () => markDryRunStale());
  }

  document.getElementById("gosaki-edit-published")?.addEventListener("change", () => {
    markDryRunStale();
  });
}

function wireSaveButton(): void {
  document
    .getElementById("gosaki-schedule-update-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      void runEditSave();
    });
}

function wireDuplicateButton(): void {
  document
    .getElementById("gosaki-schedule-duplicate-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      enterDuplicateDraftFromSelectedRow();
    });
}

function wireAddButton(): void {
  document.getElementById("gosaki-schedule-add-btn")?.addEventListener("click", (event) => {
    event.preventDefault();
    enterNewEventDraftMode();
  });
}

function wireUnpublishButton(): void {
  document
    .getElementById("gosaki-schedule-unpublish-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      enterUnpublishDraftFromSelectedRow();
    });
}

function wireDisabledActions(): void {
  const duplicateBtn = document.getElementById(
    "gosaki-schedule-duplicate-btn",
  ) as HTMLButtonElement | null;
  if (duplicateBtn) {
    duplicateBtn.disabled = false;
    duplicateBtn.removeAttribute("data-gosaki-schedule-action-disabled");
    duplicateBtn.title =
      "選択中の公演をもとに複製案を作成します（保存はまだできません）";
  }

  const addBtn = document.getElementById(
    "gosaki-schedule-add-btn",
  ) as HTMLButtonElement | null;
  if (addBtn) {
    addBtn.disabled = false;
    addBtn.removeAttribute("data-gosaki-schedule-action-disabled");
    addBtn.title = "新規追加案を作成します（保存はまだできません）";
  }

  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-gosaki-schedule-action-disabled]:not(#gosaki-schedule-update-btn):not(#gosaki-schedule-add-btn):not(#gosaki-schedule-unpublish-btn)",
    )
    .forEach((button) => {
      button.disabled = true;
      button.title = "この操作は準備中です";
    });
}

export async function initGosakiStagingScheduleOperatorUi(): Promise<void> {
  const root = getRoot();
  if (!root) return;

  selectableRows = parseRowsDataset();
  wireFilters();
  wireTableActions();
  wireAddForm();
  wireEditForm();
  wireSaveButton();
  wireDuplicateButton();
  wireAddButton();
  wireUnpublishButton();
  wireDisabledActions();
  await refreshStagingAuthSignedIn();
  renderScheduleList();
  renderEditForm(null);
  updateUnpublishButtonState();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    void initGosakiStagingScheduleOperatorUi();
  });
}
