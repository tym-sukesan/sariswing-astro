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
  G9K_SAVE_BUTTON_SAVE_ENABLED,
} from "../staging-write/gosaki-schedule-existing-event-save-button-config";
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
let stagingAuthSignedIn: boolean | null = null;
let saveInFlight = false;
let previewBase = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";

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

function renderEditForm(row: ScheduleRecord | null): void {
  const emptyEl = document.getElementById("gosaki-schedule-operator-edit-empty");
  const formEl = document.getElementById("gosaki-schedule-edit-form");
  if (!emptyEl || !formEl) return;

  if (!row) {
    emptyEl.hidden = false;
    formEl.hidden = true;
    selectedRowSnapshot = null;
    clearDryRunResult();
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
  clearDryRunResult();
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
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el) return;
  el.hidden = true;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--stale",
    "gosaki-schedule-edit-dry-run--ready",
  );
  el.innerHTML = "";
  updateSaveButtonState(null);
  clearSaveResult();
}

function markDryRunStale(): void {
  if (!lastDryRunResult) return;
  const el = document.getElementById("gosaki-schedule-edit-dry-run-result");
  if (!el || el.hidden) return;
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

function updateSaveButtonState(result: G9kExistingEventSaveButtonDryRunResult | null): void {
  const button = document.getElementById(
    "gosaki-schedule-update-btn",
  ) as HTMLButtonElement | null;
  const note = document.getElementById("gosaki-schedule-update-btn-note");
  if (!button) return;

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
    if (note) {
      note.textContent = "保存準備OK。内容を確認して「更新する」を押してください。";
    }
    return;
  }

  button.setAttribute("data-gosaki-schedule-action-disabled", "");
  button.setAttribute("data-gosaki-save-allowed", "false");

  if (!result) {
    button.textContent = "更新する（準備中）";
    button.title = gate.reason;
    if (note) {
      note.textContent =
        "「変更を確認」で dry-run を通過すると保存準備状態を表示します。Save は env arm + G-9k4 で有効化されます。";
    }
    return;
  }

  if (result.saveReadiness === "ready_but_save_disabled" && result.ok) {
    button.textContent = "更新する（G-9k4で有効化予定）";
    button.title = gate.reason;
    if (note) {
      note.textContent =
        "保存準備OK。ただし Save は未開放です（G9K_SAVE_BUTTON_SAVE_ENABLED=false または env arm 未設定）。";
    }
    return;
  }

  button.textContent = "更新する（保存不可）";
  button.title = gate.reason;
  if (note) {
    if (result.saveReadiness === "no_changes") {
      note.textContent = "変更がありません。保存できません。";
    } else {
      note.textContent = gate.reason || "確認エラーがあります。保存できません。";
    }
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
      ? "保存準備OK。Save が有効な場合は「更新する」から保存できます。"
      : "保存準備OK。ただし Save は未開放です（G9K_SAVE_BUTTON_SAVE_ENABLED=false または env arm 未設定）。";
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
    <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。保存はまだ実行されません。</p>
    <p class="gosaki-schedule-edit-dry-run__save-disabled" data-gosaki-save-allowed="false">
      Save 実行には G-9k 専用 env arm / approvalId が必要です。G9K_SAVE_BUTTON_SAVE_ENABLED=false の間は DB UPDATE しません。
    </p>
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

  el.hidden = false;
  const success = outcome.result && !("errorCode" in outcome.result);
  el.className = `gosaki-schedule-edit-save-result${success ? " gosaki-schedule-edit-save-result--ok" : " gosaki-schedule-edit-save-result--error"}`;

  const changedChips = renderChangedFieldChips(outcome.changedFields);
  const payloadChips = renderPayloadKeys(outcome.payloadKeys);
  const diffRows = outcome.beforeAfterDiff ? renderSaveDiffRows(outcome.beforeAfterDiff) : "";

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "保存結果" : "保存できませんでした"}</h3>
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>target id</dt><dd><code>${escapeHtml(outcome.beforeRecord?.id ?? "—")}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(outcome.beforeRecord?.legacy_id ?? "—")}</code></dd></div>
      <div><dt>title</dt><dd>${escapeHtml(displayValue(outcome.afterRecord?.title ?? outcome.beforeRecord?.title))}</dd></div>
      <div><dt>date</dt><dd>${escapeHtml(outcome.beforeRecord?.date ?? "—")}</dd></div>
      <div><dt>venue</dt><dd>${escapeHtml(displayValue(outcome.afterRecord?.venue ?? outcome.beforeRecord?.venue))}</dd></div>
      <div><dt>before updated_at</dt><dd><code>${escapeHtml(outcome.beforeRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>post-save updated_at</dt><dd><code>${escapeHtml(outcome.afterRecord?.updated_at ?? "—")}</code></dd></div>
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

function clearSaveResult(): void {
  const el = document.getElementById("gosaki-schedule-edit-save-result");
  if (!el) return;
  el.hidden = true;
  el.className = "gosaki-schedule-edit-save-result";
  el.innerHTML = "";
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
  if (!G9K_SAVE_BUTTON_SAVE_ENABLED) {
    window.alert(
      "G9K_SAVE_BUTTON_SAVE_ENABLED=false のため Save は未開放です。G-9k4 で有効化してください。",
    );
    return;
  }

  const config = getG9kExistingEventSaveButtonConfig();
  if (!config.saveEnabled) {
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
  renderSaveResult(outcome);

  const success = outcome.result && !("errorCode" in outcome.result);
  if (success && outcome.afterRecord && outcome.result && !("errorCode" in outcome.result)) {
    const writeResult = outcome.result;
    const updatedRow: ScheduleRecord = {
      ...selectedRowSnapshot,
      ...(writeResult.afterSnapshot ?? {}),
      updated_at: outcome.afterRecord.updated_at,
    };
    selectedRowSnapshot = updatedRow;
    const index = selectableRows.findIndex((row) => row.id === updatedRow.id);
    if (index >= 0) selectableRows[index] = updatedRow;
    renderScheduleList();
    renderEditForm(updatedRow);
    clearDryRunResult();
    clearSaveResult();
  } else {
    updateSaveButtonState(lastDryRunResult);
  }
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
        <td>${escapeHtml(displayValue(row.title))}</td>
        <td>${escapeHtml(displayValue(row.venue))}</td>
        <td>${escapeHtml(displayValue(row.open_time))}</td>
        <td>${escapeHtml(displayValue(row.start_time))}</td>
        <td>${escapeHtml(displayValue(row.price))}</td>
        <td>${renderScheduleRowButton(row.id, selected)}</td>
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
  if (!confirmDiscardDirtyCandidateIfNeeded(rowId)) return;

  selectedRowId = rowId;
  selectedRowSnapshot = { ...row };
  renderScheduleList();
  renderEditForm(row);
  dispatchRowSelected(row);

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
}

function wireSaveButton(): void {
  document
    .getElementById("gosaki-schedule-update-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      void runEditSave();
    });
}

function wireDisabledActions(): void {
  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-gosaki-schedule-action-disabled]:not(#gosaki-schedule-update-btn)",
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
  wireDisabledActions();
  await refreshStagingAuthSignedIn();
  renderScheduleList();
  renderEditForm(null);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    void initGosakiStagingScheduleOperatorUi();
  });
}
