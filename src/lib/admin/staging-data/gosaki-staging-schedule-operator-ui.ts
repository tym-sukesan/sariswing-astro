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
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import {
  loadGosakiSchedulesAuthenticatedAdminRead,
  type GosakiScheduleAdminReadMode,
} from "./gosaki-schedule-authenticated-admin-read";
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
import {
  buildGosakiScheduleRepublishDraft,
  executeG22hScheduleRepublishDryRun,
  type G22hScheduleRepublishDryRunResult,
  type GosakiScheduleRepublishDraftState,
} from "../staging-write/gosaki-schedule-republish-dry-run";
import {
  evaluateG22hRepublishUpdateUiGate,
  getG22hRepublishUpdateConfig,
} from "../staging-write/gosaki-schedule-republish-update-config";
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
let ssrBootstrapRows: ScheduleRecord[] = [];
let adminReadMode: GosakiScheduleAdminReadMode = "ssr-bootstrap";
let adminReadInFlight = false;
let adminReadError: string | null = null;
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
let republishDraftState: GosakiScheduleRepublishDraftState | null = null;
let republishTargetSnapshot: ScheduleRecord | null = null;
let lastRepublishDryRunResult: G22hScheduleRepublishDryRunResult | null = null;

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
  return "保存は現在無効です。確認のみ完了しました（DBは変わっていません）。";
}

function operatorSaveEnabledMessage(): string {
  return "保存が有効です。内容を確認し、保存ボタンを1回だけ押すとDBに反映されます（連打禁止）。";
}

function operatorSavePrepMessage(): string {
  if (isG9kOperatorSaveEnabled()) {
    return "「変更を確認」で内容を確認してから、保存ボタンを1回だけ押してください（連打禁止）。";
  }
  return `先に「変更を確認」してください。${operatorSaveDisabledMessage()}`;
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

type GosakiScheduleOperationKind =
  | "existing-update"
  | "duplicate"
  | "new-event"
  | "unpublish"
  | "republish";

const OPERATION_KIND_LABELS: Record<GosakiScheduleOperationKind, string> = {
  "existing-update": "既存公演を更新",
  duplicate: "複製して新規下書きを作成",
  "new-event": "新規公演を追加",
  unpublish: "公演を非公開にする",
  republish: "公演を再公開する",
};

const WORKFLOW_STEP_LABELS: Record<GosakiScheduleOperationKind, [string, string, string]> = {
  "existing-update": ["公演を選択", "変更を確認", "更新する"],
  duplicate: ["複製案を作成", "変更を確認", "複製案を保存"],
  "new-event": ["新規追加案を作成", "変更を確認", "新規追加を保存"],
  unpublish: ["非公開化案を作成", "変更を確認", "非公開化を保存"],
  republish: ["再公開案を作成", "変更を確認", "再公開を保存"],
};

const OPERATION_PROCEDURE_BUTTON_LABELS: Record<GosakiScheduleOperationKind, string> = {
  "existing-update": "「変更を確認」",
  duplicate: "「複製案を作成」",
  "new-event": "「新規追加案を作成」",
  unpublish: "「非公開化案を作成」",
  republish: "「再公開案を作成」",
};

const OPERATION_DRY_RUN_BUTTON_LABEL = "「変更を確認」";

function renderPublicReflectionPendingNote(): string {
  return `<p class="gosaki-schedule-preview-confirmation__public-reflection" role="note">公開サイトへの反映は別フェーズです。DBで <code>published=true</code> になっても、次回 public reflection / package / FTP まで公開サイトには表示されません。</p>`;
}

function renderOperationProcedureDetail(kind: GosakiScheduleOperationKind): string {
  const createLabel = OPERATION_PROCEDURE_BUTTON_LABELS[kind];
  const saveEnabled = resolveOperationSaveEnabled(kind);
  const saveState = saveEnabled
    ? `<strong>保存が有効です。</strong> 保存ボタンは<strong>1回だけ</strong>押してください（連打禁止）。`
    : `<strong>現在は保存無効です。</strong> ${operatorSaveDisabledMessage()}`;
  const kindNotes: Record<GosakiScheduleOperationKind, string> = {
    "existing-update":
      `${OPERATION_DRY_RUN_BUTTON_LABEL} = 保存前プレビュー。DBは変わりません。`,
    duplicate: `${createLabel} = 元の公演は変更しません。${OPERATION_DRY_RUN_BUTTON_LABEL} までDBは変わりません。`,
    "new-event": `${createLabel} = まだ保存されません。${OPERATION_DRY_RUN_BUTTON_LABEL} までDBは変わりません。`,
    unpublish: `${createLabel} = 行は削除しません。${OPERATION_DRY_RUN_BUTTON_LABEL} までDBは変わりません。「非公開化を保存」= published を false にします（物理削除ではありません）。`,
    republish: `${createLabel} = published を false から true に戻す操作です。${OPERATION_DRY_RUN_BUTTON_LABEL} までDBは変わりません。保存ボタンを押すまでDBは変更されません。公開サイトへの反映は別フェーズです。`,
  };
  return `
    <section class="gosaki-schedule-procedure-hint-detail" aria-label="操作手順ヒント">
      <ol class="gosaki-schedule-procedure-hint-detail__steps">
        <li><strong>Step 1</strong> — ${escapeHtml(WORKFLOW_STEP_LABELS[kind][0])}</li>
        <li><strong>Step 2</strong> — ${escapeHtml(WORKFLOW_STEP_LABELS[kind][1])}（DBは変わりません）</li>
        <li><strong>Step 3</strong> — ${saveEnabled ? escapeHtml(WORKFLOW_STEP_LABELS[kind][2]) : "戸山が確認して保存"}</li>
      </ol>
      <p class="gosaki-schedule-procedure-hint-detail__note">${kindNotes[kind]}</p>
      <p class="gosaki-schedule-procedure-hint-detail__save-state">${saveState}</p>
      <p class="gosaki-schedule-procedure-hint-detail__no-delete">行の物理削除は行いません（削除ボタンは準備中）。</p>
    </section>
  `;
}

function resolveOperationSaveEnabled(kind: GosakiScheduleOperationKind): boolean {
  if (kind === "republish") {
    return evaluateG22hRepublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      republishMode: true,
      target: republishTargetSnapshot,
      republishDryRunResult: lastRepublishDryRunResult,
    }).enabled;
  }
  if (kind === "unpublish") {
    return evaluateG22fUnpublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      unpublishMode: true,
      target: unpublishTargetSnapshot,
      unpublishDryRunResult: lastUnpublishDryRunResult,
    }).enabled;
  }
  if (kind === "duplicate") {
    return evaluateG22dDuplicateInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      duplicateMode: true,
      source: duplicateSourceSnapshot,
      duplicateDryRunResult: lastDuplicateDryRunResult,
    }).enabled;
  }
  if (kind === "new-event") {
    return evaluateG22eNewEventInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      newEventMode: true,
      newEventDryRunResult: lastNewEventDryRunResult,
      hasExistingScheduleId: hasNewEventExistingScheduleId(),
      hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
    }).enabled;
  }
  return evaluateG9kOperatorSaveButtonUiGate({
    signedIn: stagingAuthSignedIn === true,
    selectedRow: selectedRowSnapshot,
    dryRunResult: lastDryRunResult,
  }).enabled;
}

function updateActiveProcedureHintCard(): void {
  let active: GosakiScheduleOperationKind | "none" = "none";
  if (isRepublishDraftMode()) active = "republish";
  else if (isUnpublishDraftMode()) active = "unpublish";
  else if (isDuplicateDraftMode()) active = "duplicate";
  else if (isNewEventDraftMode()) active = "new-event";
  else if (selectedRowSnapshot && editDraftMode === "existing") active = "existing-update";

  document.querySelectorAll<HTMLElement>("[data-gosaki-procedure-hint]").forEach((node) => {
    const kind = node.getAttribute("data-gosaki-procedure-hint");
    node.classList.toggle(
      "gosaki-schedule-operator-procedure-hints__card--active",
      kind === active,
    );
  });
}

function updateAdminReadProcedureHint(): void {
  const el = document.getElementById("gosaki-schedule-admin-read-procedure-hint");
  if (!el) return;
  el.hidden = adminReadMode !== "admin-authenticated";
}

function renderPreviewBadge(): string {
  return `<p class="gosaki-schedule-preview-confirmation__badge" role="status">保存前プレビュー — <code>actualWrite=false</code>（データベースはまだ変更されません）</p>`;
}

function renderSaveResultBadge(): string {
  return `<p class="gosaki-schedule-save-result__badge" role="status">保存結果 — DB への反映結果です（保存前プレビューではありません）</p>`;
}

function renderOptimisticLockExplanation(): string {
  return `<p class="gosaki-schedule-edit-dry-run__lock-note">optimistic lock の説明: <strong>保存前 updated_at（before updated_at）</strong> は Save 実行直前の行バージョンです。<strong>保存後 updated_at（saved updated_at）</strong> は DB が更新した新しい値です。通常、両者は一致しません。</p>`;
}

function renderWorkflowStepIndicator(
  kind: GosakiScheduleOperationKind,
  currentStep: 1 | 2 | 3,
): string {
  const labels = WORKFLOW_STEP_LABELS[kind];
  const items = labels
    .map((label, index) => {
      const step = (index + 1) as 1 | 2 | 3;
      const state = step < currentStep ? "done" : step === currentStep ? "current" : "upcoming";
      return `<li class="gosaki-schedule-workflow-steps__item gosaki-schedule-workflow-steps__item--${state}"><span class="gosaki-schedule-workflow-steps__num" aria-hidden="true">${step}</span><span>${escapeHtml(label)}</span></li>`;
    })
    .join("");
  return `<ol class="gosaki-schedule-workflow-steps" aria-label="操作の流れ">${items}</ol>`;
}

function renderOperationKindHeader(kind: GosakiScheduleOperationKind): string {
  return `<p class="gosaki-schedule-preview-confirmation__operation"><strong>${escapeHtml(OPERATION_KIND_LABELS[kind])}</strong> <code>${escapeHtml(kind)}</code></p>`;
}

function renderOperationSpecificNote(kind: GosakiScheduleOperationKind): string {
  if (kind === "republish") {
    return `<p class="gosaki-schedule-preview-confirmation__note">「再公開案を作成」= published を false から true に戻します（物理削除ではありません）。${renderPublicReflectionPendingNote()}</p>`;
  }
  if (kind === "unpublish") {
    return `<p class="gosaki-schedule-preview-confirmation__note">「非公開化案を作成」= 行は削除しません。「非公開化を保存」= <code>published</code> を false にします（物理削除ではありません）。</p>`;
  }
  if (kind === "duplicate") {
    return `<p class="gosaki-schedule-preview-confirmation__note">「複製案を作成」= 元の公演は変更しません。新しい <code>published=false</code> の行を INSERT します。</p>`;
  }
  if (kind === "new-event") {
    return `<p class="gosaki-schedule-preview-confirmation__note">「新規追加案を作成」= まだ保存されません。<code>published=false</code> の新規行として追加します。</p>`;
  }
  return `<p class="gosaki-schedule-preview-confirmation__note">「変更を確認」= 保存前プレビュー。DBは変わりません。保存ボタンを押すまでDBは変更されません。</p>`;
}

function renderTargetIdentitySection(options: {
  legacyId?: string | null;
  targetId?: string | null;
  date?: string | null;
  title?: string | null;
  publishedBefore?: string | null;
  publishedAfter?: string | null;
}): string {
  const publishedRow =
    options.publishedBefore != null || options.publishedAfter != null
      ? `<div><dt>published（変更前 → 変更後）</dt><dd><code>${escapeHtml(options.publishedBefore ?? "—")}</code> → <code>${escapeHtml(options.publishedAfter ?? "—")}</code></dd></div>`
      : "";
  return `
    <section class="gosaki-schedule-preview-confirmation__identity">
      <h4 class="gosaki-schedule-preview-confirmation__identity-title">対象公演の確認</h4>
      <dl class="gosaki-schedule-preview-confirmation__identity-grid">
        <div class="gosaki-schedule-preview-confirmation__identity-legacy">
          <dt>legacy_id</dt>
          <dd>${renderLegacyIdCode(options.legacyId)}</dd>
        </div>
        <div><dt>id</dt><dd><code class="gosaki-schedule-row-id-code">${escapeHtml(displayValue(options.targetId))}</code></dd></div>
        <div><dt>日付</dt><dd>${escapeHtml(displayValue(options.date))}</dd></div>
        <div><dt>タイトル</dt><dd>${escapeHtml(displayValue(options.title))}</dd></div>
        ${publishedRow}
      </dl>
    </section>
  `;
}

function renderPreviewSafetySection(options: {
  operation: string;
  dryRun: boolean;
  actualWrite: boolean;
  wouldUpdate?: boolean;
  wouldInsert?: boolean;
  wouldDelete?: boolean;
  physicalDelete?: boolean;
  saveAllowed?: boolean;
  saveEnabled?: boolean;
  approvalId?: string | null;
  expectedBeforeUpdatedAt?: string | null;
}): string {
  const bool = (value: boolean | undefined) =>
    value == null ? "—" : `<code>${String(value)}</code>`;
  const lockRow = options.expectedBeforeUpdatedAt
    ? `<div><dt>保存前 updated_at（before updated_at）</dt><dd><code>${escapeHtml(options.expectedBeforeUpdatedAt)}</code></dd></div>`
    : "";
  return `
    <section class="gosaki-schedule-preview-confirmation__safety">
      <h4 class="gosaki-schedule-preview-confirmation__safety-title">安全確認</h4>
      <dl class="gosaki-schedule-preview-confirmation__safety-grid">
        <div><dt>operation</dt><dd><code>${escapeHtml(options.operation)}</code></dd></div>
        <div><dt>dryRun</dt><dd>${bool(options.dryRun)}</dd></div>
        <div><dt>actualWrite</dt><dd>${bool(options.actualWrite)}</dd></div>
        <div><dt>wouldUpdate</dt><dd>${bool(options.wouldUpdate)}</dd></div>
        <div><dt>wouldInsert</dt><dd>${bool(options.wouldInsert)}</dd></div>
        <div><dt>wouldDelete</dt><dd>${bool(options.wouldDelete)}</dd></div>
        <div><dt>physicalDelete</dt><dd>${bool(options.physicalDelete)}</dd></div>
        <div><dt>saveAllowed</dt><dd>${bool(options.saveAllowed)}</dd></div>
        <div><dt>saveEnabled</dt><dd>${bool(options.saveEnabled)}</dd></div>
        <div><dt>approvalId</dt><dd><code>${escapeHtml(displayValue(options.approvalId))}</code></dd></div>
        ${lockRow}
      </dl>
      <p class="gosaki-schedule-preview-confirmation__no-delete">行は削除しません（physical DELETE ではありません）。</p>
    </section>
  `;
}

function resolveWorkflowStep(kind: GosakiScheduleOperationKind): 1 | 2 | 3 {
  if (kind === "republish") {
    if (lastRepublishDryRunResult?.ok) return 2;
    return republishDraftState ? 2 : 1;
  }
  if (kind === "unpublish") {
    const gate = evaluateG22fUnpublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      unpublishMode: true,
      target: unpublishTargetSnapshot,
      unpublishDryRunResult: lastUnpublishDryRunResult?.ok ? lastUnpublishDryRunResult : null,
    });
    if (gate.enabled) return 3;
    if (lastUnpublishDryRunResult?.ok) return 2;
    return 2;
  }
  if (kind === "duplicate") {
    const gate = evaluateG22dDuplicateInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      duplicateMode: true,
      source: duplicateSourceSnapshot,
      duplicateDryRunResult: lastDuplicateDryRunResult,
    });
    if (gate.enabled) return 3;
    if (lastDuplicateDryRunResult?.ok) return 2;
    return 2;
  }
  if (kind === "new-event") {
    const gate = evaluateG22eNewEventInsertUiGate({
      signedIn: stagingAuthSignedIn === true,
      newEventMode: true,
      newEventDryRunResult: lastNewEventDryRunResult,
      hasExistingScheduleId: hasNewEventExistingScheduleId(),
      hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
    });
    if (gate.enabled) return 3;
    if (lastNewEventDryRunResult?.ok) return 2;
    return 2;
  }
  const gate = evaluateG9kOperatorSaveButtonUiGate({
    signedIn: stagingAuthSignedIn === true,
    selectedRow: selectedRowSnapshot,
    dryRunResult: lastDryRunResult,
  });
  if (gate.enabled) return 3;
  if (lastDryRunResult?.ok) return 2;
  return selectedRowSnapshot ? 1 : 1;
}

function updateSaveTargetPanel(): void {
  const panel = document.getElementById("gosaki-schedule-save-target-panel");
  if (!panel) return;

  if (isRepublishDraftMode() && republishTargetSnapshot) {
    const kind: GosakiScheduleOperationKind = "republish";
    const step = resolveWorkflowStep(kind);
    const expectedBeforeUpdatedAt =
      republishDraftState?.expectedBeforeUpdatedAt ??
      republishTargetSnapshot.updated_at ??
      "—";
    panel.hidden = false;
    panel.innerHTML = `
      ${renderWorkflowStepIndicator(kind, step)}
      ${renderOperationKindHeader(kind)}
      ${renderOperationSpecificNote(kind)}
      ${renderOperationProcedureDetail(kind)}
      ${renderTargetIdentitySection({
        legacyId: republishTargetSnapshot.legacy_id,
        targetId: republishTargetSnapshot.id,
        date: republishTargetSnapshot.date,
        title: republishTargetSnapshot.title,
        publishedBefore: "false",
        publishedAfter: "true",
      })}
      <section class="gosaki-schedule-preview-confirmation__safety">
        <h4 class="gosaki-schedule-preview-confirmation__safety-title">再公開の確認</h4>
        <dl class="gosaki-schedule-preview-confirmation__safety-grid">
          <div><dt>expectedBeforeUpdatedAt</dt><dd><code>${escapeHtml(String(expectedBeforeUpdatedAt))}</code></dd></div>
          <div><dt>actualWrite</dt><dd><code>false</code></dd></div>
          <div><dt>publicReflectionPending</dt><dd><code>true</code></dd></div>
        </dl>
        ${renderPublicReflectionPendingNote()}
      </section>
    `;
    updateActiveProcedureHintCard();
    return;
  }

  if (isUnpublishDraftMode() && unpublishTargetSnapshot) {
    const kind: GosakiScheduleOperationKind = "unpublish";
    const step = resolveWorkflowStep(kind);
    panel.hidden = false;
    panel.innerHTML = `
      ${renderWorkflowStepIndicator(kind, step)}
      ${renderOperationKindHeader(kind)}
      ${renderOperationSpecificNote(kind)}
      ${renderOperationProcedureDetail(kind)}
      ${renderTargetIdentitySection({
        legacyId: unpublishTargetSnapshot.legacy_id,
        targetId: unpublishTargetSnapshot.id,
        date: unpublishTargetSnapshot.date,
        title: unpublishTargetSnapshot.title,
        publishedBefore: "true",
        publishedAfter: "false",
      })}
    `;
    updateActiveProcedureHintCard();
    return;
  }

  if (isDuplicateDraftMode() && duplicateSourceSnapshot) {
    const kind: GosakiScheduleOperationKind = "duplicate";
    panel.hidden = false;
    panel.innerHTML = `
      ${renderWorkflowStepIndicator(kind, resolveWorkflowStep(kind))}
      ${renderOperationKindHeader(kind)}
      ${renderOperationSpecificNote(kind)}
      ${renderOperationProcedureDetail(kind)}
      ${renderTargetIdentitySection({
        legacyId: duplicateSourceSnapshot.legacy_id,
        targetId: duplicateSourceSnapshot.id,
        date: duplicateSourceSnapshot.date,
        title: duplicateSourceSnapshot.title,
      })}
    `;
    updateActiveProcedureHintCard();
    return;
  }

  if (isNewEventDraftMode()) {
    const kind: GosakiScheduleOperationKind = "new-event";
    const date = readEditFormDate();
    const title = readEditFormSafeValues().title;
    panel.hidden = false;
    panel.innerHTML = `
      ${renderWorkflowStepIndicator(kind, resolveWorkflowStep(kind))}
      ${renderOperationKindHeader(kind)}
      ${renderOperationSpecificNote(kind)}
      ${renderOperationProcedureDetail(kind)}
      ${renderTargetIdentitySection({
        legacyId: GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL,
        date,
        title,
        publishedBefore: "false",
        publishedAfter: "false",
      })}
    `;
    updateActiveProcedureHintCard();
    return;
  }

  if (selectedRowSnapshot && editDraftMode === "existing") {
    const kind: GosakiScheduleOperationKind = "existing-update";
    panel.hidden = false;
    panel.innerHTML = `
      ${renderWorkflowStepIndicator(kind, resolveWorkflowStep(kind))}
      ${renderOperationKindHeader(kind)}
      ${renderOperationSpecificNote(kind)}
      ${renderOperationProcedureDetail(kind)}
      ${renderTargetIdentitySection({
        legacyId: selectedRowSnapshot.legacy_id,
        targetId: selectedRowSnapshot.id,
        date: selectedRowSnapshot.date,
        title: selectedRowSnapshot.title,
        publishedBefore: formatPublishedStatus(selectedRowSnapshot.published),
        publishedAfter: formatPublishedStatus(selectedRowSnapshot.published),
      })}
    `;
    updateActiveProcedureHintCard();
    return;
  }

  panel.hidden = true;
  panel.innerHTML = "";
  updateActiveProcedureHintCard();
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

function formatPublishedStatus(published: boolean | null | undefined): string {
  return published === true ? "公開" : "非公開";
}

function formatUpdatedAtDisplay(value: string | null | undefined): string {
  return displayValue(value);
}

function renderLegacyIdCode(legacyId: string | null | undefined): string {
  const value = displayValue(legacyId);
  return `<code class="gosaki-schedule-legacy-id-code" title="${escapeHtml(value)}">${escapeHtml(value)}</code>`;
}

function renderScheduleTableRowMeta(row: ScheduleRecord): string {
  const published = row.published === true;
  return `<p class="admin-gosaki-schedule-row-meta" aria-label="行の識別情報">
    <span class="admin-gosaki-schedule-row-meta__status admin-gosaki-schedule-row-meta__status--${published ? "published" : "draft"}">${formatPublishedStatus(row.published)}</span>
    <span class="admin-gosaki-schedule-row-meta__updated">更新: <time datetime="${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}">${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}</time></span>
  </p>`;
}

function renderScheduleTableRowActions(row: ScheduleRecord, selected: boolean): string {
  return `<div class="admin-gosaki-schedule-row-actions">
    ${renderScheduleTableRowMeta(row)}
    ${renderScheduleRowButton(row.id, selected)}
  </div>`;
}

function renderSelectedRowSummary(row: ScheduleRecord | null): void {
  const panel = document.getElementById("gosaki-schedule-operator-selected-summary");
  if (!panel) return;

  if (!row) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }

  const published = row.published === true;
  panel.hidden = false;
  panel.innerHTML = `
    <h3 class="gosaki-schedule-operator-selected-summary__title">選択中の公演</h3>
    <dl class="gosaki-schedule-operator-selected-summary__grid">
      <div class="gosaki-schedule-operator-selected-summary__item gosaki-schedule-operator-selected-summary__item--legacy">
        <dt>legacy_id</dt>
        <dd>${renderLegacyIdCode(row.legacy_id)}</dd>
      </div>
      <div class="gosaki-schedule-operator-selected-summary__item">
        <dt>日付</dt>
        <dd><time datetime="${escapeHtml(row.date)}">${escapeHtml(row.date)}</time></dd>
      </div>
      <div class="gosaki-schedule-operator-selected-summary__item">
        <dt>タイトル</dt>
        <dd>${escapeHtml(displayValue(row.title))}</dd>
      </div>
      <div class="gosaki-schedule-operator-selected-summary__item">
        <dt>公開状態</dt>
        <dd><span class="gosaki-schedule-operator-selected-summary__status gosaki-schedule-operator-selected-summary__status--${published ? "published" : "draft"}">${formatPublishedStatus(row.published)}</span></dd>
      </div>
      <div class="gosaki-schedule-operator-selected-summary__item gosaki-schedule-operator-selected-summary__item--id">
        <dt>id</dt>
        <dd><code class="gosaki-schedule-row-id-code" title="${escapeHtml(row.id)}">${escapeHtml(row.id)}</code></dd>
      </div>
      <div class="gosaki-schedule-operator-selected-summary__item gosaki-schedule-operator-selected-summary__item--updated">
        <dt>updated_at</dt>
        <dd><time datetime="${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}">${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}</time></dd>
      </div>
    </dl>
  `;
}

function displayDryRunValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || "（空）";
}

function renderOperatorReadSourceBanner(): void {
  const root = getRoot();
  const banner = document.getElementById("gosaki-schedule-operator-read-source-banner");
  if (!root || !banner) return;

  root.dataset.adminReadMode = adminReadMode;

  const source = String(root.dataset.readSource ?? "").trim().toLowerCase();
  const hasSsrBootstrap = ssrBootstrapRows.length > 0;
  const isMockSource = source !== "supabase" || !hasSsrBootstrap;

  if (isMockSource) {
    banner.hidden = false;
    banner.className =
      "gosaki-schedule-operator-read-source-banner gosaki-schedule-operator-read-source-banner--mock";
    banner.setAttribute("role", "alert");
    const sourceLabel = source || "unavailable";
    banner.innerHTML = `
      <p class="gosaki-schedule-operator-read-source-banner__text">
        <strong>データソース: ${escapeHtml(sourceLabel)} — 実データではありません。</strong>
        ページ下部の「開発者向け詳細」や mock UI は Gosaki の本番運用操作では使いません。
        Supabase 接続時のみ上部の公演一覧が通常操作対象です。
      </p>
    `;
    return;
  }

  if (adminReadInFlight || adminReadMode === "loading") {
    banner.hidden = false;
    banner.className =
      "gosaki-schedule-operator-read-source-banner gosaki-schedule-operator-read-source-banner--loading";
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <p class="gosaki-schedule-operator-read-source-banner__text">
        <strong>管理データを読み込み中…</strong> Supabase admin read（authenticated）で全件を取得しています。
      </p>
    `;
    return;
  }

  if (adminReadMode === "admin-authenticated") {
    const unpublishedCount = selectableRows.filter((row) => row.published === false).length;
    banner.hidden = false;
    banner.className =
      "gosaki-schedule-operator-read-source-banner gosaki-schedule-operator-read-source-banner--admin";
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <p class="gosaki-schedule-operator-read-source-banner__text">
        <strong>データソース: Supabase admin read（authenticated）</strong>
        — 非公開行を含む ${selectableRows.length} 件（非公開 ${unpublishedCount} 件）。
        「非公開のみ」フィルタや <code>legacy_id</code> 検索で非公開行を探せます。公開サイトには非公開行は表示されません。
        通常の Schedule 操作はこの画面上部の公演一覧で行ってください。
      </p>
    `;
    updateAdminReadProcedureHint();
    return;
  }

  if (adminReadMode === "error-fallback-bootstrap") {
    banner.hidden = false;
    banner.className =
      "gosaki-schedule-operator-read-source-banner gosaki-schedule-operator-read-source-banner--warn";
    banner.setAttribute("role", "alert");
    banner.innerHTML = `
      <p class="gosaki-schedule-operator-read-source-banner__text">
        <strong>admin read 失敗 — 公開行 bootstrap を表示中。</strong>
        ${escapeHtml(adminReadError ?? "Authenticated admin read failed.")}
        <button type="button" class="gosaki-schedule-operator-read-source-banner__retry" id="gosaki-schedule-admin-read-retry">再読み込み</button>
      </p>
    `;
    updateAdminReadProcedureHint();
    return;
  }

  banner.hidden = false;
  banner.className =
    "gosaki-schedule-operator-read-source-banner gosaki-schedule-operator-read-source-banner--live";
  banner.setAttribute("role", "status");
  banner.innerHTML = `
    <p class="gosaki-schedule-operator-read-source-banner__text">
      <strong>データソース: Supabase bootstrap（公開行のみ）</strong>
      — ログイン後に全件（非公開行を含む）を読み込みます。
      通常の Schedule 操作はこの画面上部の公演一覧で行ってください。
    </p>
  `;
  updateAdminReadProcedureHint();
}

function clearSelectionIfRowMissing(): void {
  if (!selectedRowId) return;
  if (selectableRows.some((row) => row.id === selectedRowId)) return;
  selectedRowId = null;
  selectedRowSnapshot = null;
}

function revertToSsrBootstrapRows(): void {
  adminReadMode = "ssr-bootstrap";
  adminReadError = null;
  adminReadInFlight = false;
  selectableRows = [...ssrBootstrapRows];
  clearSelectionIfRowMissing();
  renderScheduleList();
  renderOperatorReadSourceBanner();
  renderEditForm(selectedRowSnapshot);
  updateUnpublishButtonState();
  updateRepublishButtonState();
  updateSaveTargetPanel();
}

async function runAuthenticatedAdminReadRefetch(): Promise<void> {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return;

  const signedIn = await resolveStagingAuthSignedIn();
  if (!signedIn) {
    revertToSsrBootstrapRows();
    return;
  }

  adminReadInFlight = true;
  adminReadMode = "loading";
  renderOperatorReadSourceBanner();

  const result = await loadGosakiSchedulesAuthenticatedAdminRead({
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    supabaseUrl: url,
    anonKey,
  });

  adminReadInFlight = false;

  if (result.ok && result.mode === "admin-authenticated") {
    adminReadMode = "admin-authenticated";
    adminReadError = null;
    selectableRows = result.records;
    clearSelectionIfRowMissing();
    renderScheduleList();
    renderOperatorReadSourceBanner();
    renderEditForm(selectedRowSnapshot);
    updateUnpublishButtonState();
  updateRepublishButtonState();
    updateSaveTargetPanel();
    return;
  }

  if (result.mode === "ssr-bootstrap") {
    revertToSsrBootstrapRows();
    return;
  }

  adminReadMode = "error-fallback-bootstrap";
  adminReadError = result.error ?? "Authenticated admin read failed.";
  selectableRows = [...ssrBootstrapRows];
  clearSelectionIfRowMissing();
  renderScheduleList();
  renderOperatorReadSourceBanner();
  renderEditForm(selectedRowSnapshot);
  updateUnpublishButtonState();
  updateRepublishButtonState();
  updateSaveTargetPanel();
}

function subscribeScheduleOperatorAuthRefetch(): void {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return;

  try {
    const client = getStagingSupabaseClient(url, anonKey);
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void runAuthenticatedAdminReadRefetch();
      } else {
        revertToSsrBootstrapRows();
        void refreshStagingAuthSignedIn();
      }
    });
  } catch {
    // Auth client unavailable — stay on SSR bootstrap.
  }
}

function wireAdminReadRetryButton(): void {
  const banner = document.getElementById("gosaki-schedule-operator-read-source-banner");
  banner?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== "gosaki-schedule-admin-read-retry") return;
    void runAuthenticatedAdminReadRefetch();
  });
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
    const haystack = [row.legacy_id, row.id, row.title, row.venue, row.description]
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

function isRepublishDraftMode(): boolean {
  return editDraftMode === "republish" && republishDraftState !== null;
}

function resetRepublishDraftMode(): void {
  editDraftMode = "existing";
  republishDraftState = null;
  republishTargetSnapshot = null;
  lastRepublishDryRunResult = null;
  updateRepublishDraftBanner(null);
  setEditFormFieldsReadOnly(false);
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
  resetRepublishDraftMode();
}

function setEditFormFieldsReadOnly(readOnly: boolean): void {
  for (const id of G22F_EDIT_FORM_FIELD_IDS) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.disabled = readOnly;
  }
}

function updateRepublishDraftBanner(state: GosakiScheduleRepublishDraftState | null): void {
  const banner = document.getElementById("gosaki-schedule-republish-draft-banner");
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
  banner.dataset.draftMode = "republish";
  banner.dataset.targetId = state.targetId;
  banner.dataset.targetLegacyId = state.targetLegacyId ?? "";
  const label = banner.querySelector("[data-target-label]");
  if (label) {
    const legacy = state.targetLegacyId ? ` / ${state.targetLegacyId}` : "";
    label.textContent = `${state.targetId}${legacy}`;
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

function updateRepublishButtonState(): void {
  const button = document.getElementById(
    "gosaki-schedule-republish-btn",
  ) as HTMLButtonElement | null;
  if (!button) return;

  if (
    isNewEventDraftMode() ||
    isDuplicateDraftMode() ||
    isUnpublishDraftMode() ||
    isRepublishDraftMode()
  ) {
    button.disabled = true;
    button.title = "他の案を編集中です。先に案をやめるか、別の操作を選んでください。";
    return;
  }

  const row = selectedRowSnapshot;
  if (!row) {
    button.disabled = true;
    button.title = "先に一覧から非公開の公演を選んでください。";
    return;
  }

  if (row.published !== false) {
    button.disabled = true;
    button.title = "このイベントは公開中です。再公開の対象にできません（published=true）。";
    return;
  }

  button.disabled = false;
  button.removeAttribute("data-gosaki-schedule-action-disabled");
  button.title = "選択中の公演を再公開する案を作成します（保存は G-22h6 以降）";
}

function updateUnpublishButtonState(): void {
  const button = document.getElementById(
    "gosaki-schedule-unpublish-btn",
  ) as HTMLButtonElement | null;
  if (!button) return;

  if (isNewEventDraftMode() || isDuplicateDraftMode() || isUnpublishDraftMode() || isRepublishDraftMode()) {
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
  if (isRepublishDraftMode()) {
    if (
      !window.confirm(
        "再公開案の編集をやめて、新規追加案を作成しますか？（再公開案は保存されません）",
      )
    ) {
      return;
    }
    resetRepublishDraftMode();
  }

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
  if (isRepublishDraftMode()) {
    if (
      !window.confirm(
        "再公開案の編集をやめて、複製案を作成しますか？（再公開案は保存されません）",
      )
    ) {
      return;
    }
    resetRepublishDraftMode();
  }

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
  if (isRepublishDraftMode()) {
    if (
      !window.confirm(
        "再公開案の編集をやめて、非公開化案を作成しますか？（再公開案は保存されません）",
      )
    ) {
      return;
    }
    resetRepublishDraftMode();
  }

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
  updateRepublishButtonState();
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
  updateRepublishButtonState();
  document
    .getElementById("gosaki-schedule-operator-edit")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function enterRepublishDraftFromSelectedRow(): void {
  if (isNewEventDraftMode()) {
    if (
      !window.confirm(
        "新規追加案の編集をやめて、再公開案を作成しますか？（新規追加案は保存されません）",
      )
    ) {
      return;
    }
    resetNewEventDraftMode();
  }

  if (isDuplicateDraftMode()) {
    if (
      !window.confirm(
        "複製案の編集をやめて、再公開案を作成しますか？（複製案は保存されません）",
      )
    ) {
      return;
    }
    resetDuplicateDraftMode();
  }

  if (isUnpublishDraftMode()) {
    if (
      !window.confirm(
        "非公開化案の編集をやめて、再公開案を作成しますか？（非公開化案は保存されません）",
      )
    ) {
      return;
    }
    resetUnpublishDraftMode();
  }

  if (!selectedRowSnapshot) {
    window.alert("先に一覧から再公開する公演を選んでください。");
    return;
  }

  if (selectedRowSnapshot.published !== false) {
    window.alert("このイベントは公開中です。再公開の対象にできません（published=true）。");
    updateRepublishButtonState();
    return;
  }

  republishTargetSnapshot = { ...selectedRowSnapshot };
  republishDraftState = buildGosakiScheduleRepublishDraft(selectedRowSnapshot);
  editDraftMode = "republish";
  lastDryRunResult = null;
  lastDuplicateDryRunResult = null;
  lastNewEventDryRunResult = null;
  lastUnpublishDryRunResult = null;
  lastRepublishDryRunResult = null;
  clearSaveResult();
  clearDryRunResult();
  updateDuplicateDraftBanner(null);
  updateNewEventDraftBanner(null);
  updateUnpublishDraftBanner(null);
  updateRepublishDraftBanner(republishDraftState);
  setEditFormFieldsReadOnly(true);
  renderEditForm(republishDraftState.source, { clearDryRun: false });
  updateSaveButtonState(null);
  updateRepublishButtonState();
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
  if (isRepublishDraftMode()) {
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
  if (isRepublishDraftMode()) {
    el.textContent = String(value ?? "").trim() || "—";
    return;
  }
  el.textContent = String(value ?? "").trim() || "—";
}

function setEditFormRowId(value: string | null | undefined): void {
  const el = document.getElementById("gosaki-edit-row-id-value");
  if (!el) return;
  if (isDuplicateDraftMode() || isNewEventDraftMode()) {
    el.textContent = "（未保存）";
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
    renderSelectedRowSummary(null);
    updateSaveTargetPanel();
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
    updateRepublishDraftBanner(null);
    if (titleEl) titleEl.textContent = "複製案を編集";
    if (leadEl) {
      leadEl.textContent =
        "複製案です。まだ保存されていません。内容を確認してから「変更を確認」を押してください。";
    }
    setEditFormUpdatedAt(null);
    setEditFormLegacyId(GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL);
    setEditFormRowId(row.id);
    setEditFormFieldsReadOnly(false);
  } else if (isNewEventDraftMode()) {
    updateDuplicateDraftBanner(null);
    updateUnpublishDraftBanner(null);
    updateRepublishDraftBanner(null);
    if (titleEl) titleEl.textContent = "新規追加案を編集";
    if (leadEl) {
      leadEl.textContent =
        "新規追加案です。まだ保存されていません。変更を確認すると、新規追加予定の内容を確認できます。";
    }
    setEditFormUpdatedAt(null);
    setEditFormLegacyId(GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL);
    setEditFormRowId(null);
    setCheckbox("gosaki-edit-published", false);
    setEditFormFieldsReadOnly(false);
  } else if (isRepublishDraftMode()) {
    updateDuplicateDraftBanner(null);
    updateNewEventDraftBanner(null);
    updateUnpublishDraftBanner(null);
    if (titleEl) titleEl.textContent = "再公開案を確認";
    if (leadEl) {
      leadEl.textContent =
        "再公開案です。published を false から true に戻す操作です。まだ保存されていません。公開サイトへの反映は別フェーズです。";
    }
    setEditFormUpdatedAt(row.updated_at);
    setEditFormLegacyId(row.legacy_id ?? "—");
    setEditFormRowId(row.id);
    setCheckbox("gosaki-edit-published", row.published === true);
    setEditFormFieldsReadOnly(true);
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
    setEditFormRowId(row.id);
    setCheckbox("gosaki-edit-published", row.published === true);
    setEditFormFieldsReadOnly(true);
  } else {
    updateDuplicateDraftBanner(null);
    updateNewEventDraftBanner(null);
    updateUnpublishDraftBanner(null);
    updateRepublishDraftBanner(null);
    setEditFormFieldsReadOnly(false);
    if (titleEl) titleEl.textContent = "選択中の公演を編集";
    if (leadEl) leadEl.textContent = "一覧で選んだ公演の内容を変更します。";
    setEditFormUpdatedAt(row.updated_at);
    setEditFormLegacyId(row.legacy_id ?? "—");
    setEditFormRowId(row.id);
  }

  if (options?.clearDryRun !== false) {
    clearDryRunResult();
  }
  renderSelectedRowSummary(row);
  updateSaveTargetPanel();
  updateUnpublishButtonState();
  updateRepublishButtonState();
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
  lastRepublishDryRunResult = null;
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
    "gosaki-schedule-edit-dry-run--republish",
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
  if (
    !lastDryRunResult &&
    !lastDuplicateDryRunResult &&
    !lastNewEventDryRunResult &&
    !lastUnpublishDryRunResult &&
    !lastRepublishDryRunResult &&
    !lastSaveOutcome
  ) {
    return;
  }
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
  lastUnpublishDryRunResult = null;
  lastRepublishDryRunResult = null;
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

  if (isRepublishDraftMode()) {
    const gate = evaluateG22hRepublishUpdateUiGate({
      signedIn: stagingAuthSignedIn === true,
      republishMode: true,
      target: republishTargetSnapshot,
      republishDryRunResult: lastRepublishDryRunResult,
    });

    button.disabled = true;
    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "再公開を保存（準備中）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "再公開案です。先に「変更を確認」してください。保存は G-22h6 以降で有効化されます。公開サイトへの反映は別フェーズです。",
    );
    updateSaveTargetPanel();
    return;
  }

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
      updateSaveTargetPanel();
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "非公開化を保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "非公開化案です。先に「変更を確認」してください。保存は現在無効です。行は物理削除しません。",
    );
    updateSaveTargetPanel();
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
      updateSaveTargetPanel();
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "新規追加案です。先に「変更を確認」してください。保存は現在無効です。",
    );
    updateSaveTargetPanel();
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
      updateSaveTargetPanel();
      return;
    }

    button.setAttribute("data-gosaki-schedule-action-disabled", "");
    button.setAttribute("data-gosaki-save-allowed", "false");
    button.textContent = "複製案を保存（現在は無効）";
    button.title = gate.reason;
    setSaveButtonNote(
      gate.reason ||
        "複製案です。先に「変更を確認」してください。保存は現在無効です。元の公演は変更しません。",
    );
    updateSaveTargetPanel();
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
    updateSaveTargetPanel();
    return;
  }

  button.setAttribute("data-gosaki-schedule-action-disabled", "");
  button.setAttribute("data-gosaki-save-allowed", "false");

  if (!result) {
    button.textContent = "更新する（準備中）";
    button.title = gate.reason;
    setSaveButtonNote(operatorSavePrepMessage());
    updateSaveTargetPanel();
    return;
  }

  if (result.saveReadiness === "ready_but_save_disabled" && result.ok) {
    button.textContent = "更新する（保存無効）";
    button.title = gate.reason;
    setSaveButtonNote(operatorSaveDisabledDryRunCompleteMessage());
    updateSaveTargetPanel();
    return;
  }

  button.textContent = "更新する（保存不可）";
  button.title = gate.reason;
  if (result.saveReadiness === "no_changes") {
    setSaveButtonNote("変更がありません。保存できません。");
  } else {
    setSaveButtonNote(gate.reason || "確認エラーがあります。保存できません。");
  }
  updateSaveTargetPanel();
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
  const insertConfig = getG22eNewEventInsertConfig();
  const gate = evaluateG22eNewEventInsertUiGate({
    signedIn: stagingAuthSignedIn === true,
    newEventMode: true,
    newEventDryRunResult: result,
    hasExistingScheduleId: hasNewEventExistingScheduleId(),
    hasDuplicateSourceId: hasNewEventDuplicateSourceId(),
  });
  const legacyLabel =
    result.payload.legacy_id == null ? GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL : String(result.payload.legacy_id);

  el.innerHTML = `
    ${renderPreviewBadge()}
    ${renderWorkflowStepIndicator("new-event", resolveWorkflowStep("new-event"))}
    <h3 class="gosaki-schedule-edit-dry-run__title">新規追加案の確認結果（保存前プレビュー）</h3>
    ${renderOperationKindHeader("new-event")}
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    ${renderOperationSpecificNote("new-event")}
    <p class="gosaki-schedule-edit-dry-run__note">
      まだ保存されていません。保存は戸山が確認して反映します。保存は現在無効です。
    </p>
    ${renderValidationWarningsList(result.validation.warnings)}
    ${result.validation.ok ? "" : renderGuardErrorList(result.guardErrors.filter((e) => !result.validation.warnings.includes(e)))}
    ${renderTargetIdentitySection({
      legacyId: legacyLabel,
      date: String(result.payload.date ?? "—"),
      title: String(result.payload.title ?? ""),
      publishedBefore: "false",
      publishedAfter: "false",
    })}
    <dl class="gosaki-schedule-edit-dry-run__target">
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
    ${renderPreviewSafetySection({
      operation: "new",
      dryRun: true,
      actualWrite: false,
      wouldUpdate: false,
      wouldInsert: result.wouldInsert,
      wouldDelete: false,
      physicalDelete: false,
      saveAllowed: gate.saveAllowed,
      saveEnabled: insertConfig.saveEnabled,
      approvalId: insertConfig.approvalId,
    })}
    ${renderNewEventDryRunDevDetails(result)}
  `;
  updateSaveButtonState(null);
  updateSaveTargetPanel();
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

  const updateConfig = getG22fUnpublishUpdateConfig();
  const gate = evaluateG22fUnpublishUpdateUiGate({
    signedIn: stagingAuthSignedIn === true,
    unpublishMode: true,
    target: unpublishTargetSnapshot,
    unpublishDryRunResult: result,
  });
  const expectedBeforeUpdatedAt = unpublishTargetSnapshot?.updated_at ?? null;

  el.innerHTML = `
    ${renderPreviewBadge()}
    ${renderWorkflowStepIndicator("unpublish", resolveWorkflowStep("unpublish"))}
    <h3 class="gosaki-schedule-edit-dry-run__title">非公開化案の確認結果（保存前プレビュー）</h3>
    ${renderOperationKindHeader("unpublish")}
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    ${renderOperationSpecificNote("unpublish")}
    ${renderValidationWarningsList(result.validation.warnings)}
    ${result.validation.ok ? "" : renderGuardErrorList(result.guardErrors)}
    ${renderTargetIdentitySection({
      legacyId: result.target.legacy_id,
      targetId: result.target.id,
      date: result.target.date,
      title: result.target.title,
      publishedBefore: String(result.before.published),
      publishedAfter: "false",
    })}
    ${renderPreviewSafetySection({
      operation: result.operation,
      dryRun: true,
      actualWrite: false,
      wouldUpdate: result.wouldUpdate,
      wouldInsert: false,
      wouldDelete: false,
      physicalDelete: false,
      saveAllowed: gate.saveAllowed,
      saveEnabled: updateConfig.saveEnabled,
      approvalId: updateConfig.approvalId,
      expectedBeforeUpdatedAt,
    })}
    ${renderOptimisticLockExplanation()}
    ${renderUnpublishDryRunDevDetails(result)}
  `;
  updateSaveButtonState(null);
  updateSaveTargetPanel();
}

function renderRepublishDryRunDevDetails(result: G22hScheduleRepublishDryRunResult): string {
  const updateConfig = getG22hRepublishUpdateConfig();
  const gate = evaluateG22hRepublishUpdateUiGate({
    signedIn: stagingAuthSignedIn === true,
    republishMode: isRepublishDraftMode(),
    target: republishTargetSnapshot,
    republishDryRunResult: result.ok ? result : null,
  });
  const expectedBeforeUpdatedAt = result.expectedBeforeUpdatedAt ?? "—";

  return `
    <details class="gosaki-schedule-republish-dry-run-dev">
      <summary>開発者向け詳細</summary>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>phase</dt><dd><code>${escapeHtml(result.phase)}</code></dd></div>
        <div><dt>approvalId (dry-run)</dt><dd><code>${escapeHtml(result.approvalId)}</code></dd></div>
        <div><dt>republish update approvalId</dt><dd><code>${escapeHtml(updateConfig.approvalId)}</code></dd></div>
        <div><dt>operation</dt><dd><code>${escapeHtml(result.operation)}</code></dd></div>
        <div><dt>saveOperation</dt><dd><code>${escapeHtml(result.saveOperation)}</code></dd></div>
        <div><dt>G-22h env arm</dt><dd><code>${escapeHtml(updateConfig.envArm)}=${updateConfig.armed ? "true" : "false"}</code></dd></div>
        <div><dt>update saveEnabled</dt><dd><code>${String(updateConfig.saveEnabled)}</code></dd></div>
        <div><dt>update saveAllowed (UI)</dt><dd><code>${String(gate.saveAllowed)}</code></dd></div>
        <div><dt>target id</dt><dd><code>${escapeHtml(result.target.id)}</code></dd></div>
        <div><dt>legacy_id</dt><dd><code>${escapeHtml(result.target.legacy_id ?? "—")}</code></dd></div>
        <div><dt>site_slug</dt><dd><code>${escapeHtml(result.target.site_slug)}</code></dd></div>
        <div><dt>before.published</dt><dd><code>false</code></dd></div>
        <div><dt>after.published</dt><dd><code>true</code></dd></div>
        <div><dt>contentFieldsChanged</dt><dd><code>false</code></dd></div>
        <div><dt>publicReflectionPending</dt><dd><code>true</code></dd></div>
        <div><dt>expectedBeforeUpdatedAt</dt><dd><code>${escapeHtml(String(expectedBeforeUpdatedAt))}</code></dd></div>
        <div><dt>wouldUpdate</dt><dd><code>${String(result.wouldUpdate)}</code></dd></div>
        <div><dt>wouldDelete</dt><dd><code>false</code></dd></div>
        <div><dt>physicalDelete</dt><dd><code>false</code></dd></div>
        <div><dt>dry-run saveAllowed</dt><dd><code>false</code></dd></div>
      </dl>
      <p class="gosaki-schedule-edit-dry-run__note">${escapeHtml(updateConfig.defaultDisabledReason)}</p>
      <pre class="gosaki-schedule-republish-dry-run-dev__json">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>
    </details>
  `;
}

function renderRepublishDryRunResult(result: G22hScheduleRepublishDryRunResult): void {
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
    "gosaki-schedule-edit-dry-run--republish",
  );

  updateSaveButtonState(null);

  if (!result.ok) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">再公開案の確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">再公開案を確認できませんでした。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認ではデータベースは変更されません。行は削除しません。保存は G-22h6 以降で有効化されます。</p>
      ${renderRepublishDryRunDevDetails(result)}
    `;
    updateSaveTargetPanel();
    return;
  }

  el.classList.add(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--ready",
    "gosaki-schedule-edit-dry-run--republish",
  );

  const updateConfig = getG22hRepublishUpdateConfig();
  const gate = evaluateG22hRepublishUpdateUiGate({
    signedIn: stagingAuthSignedIn === true,
    republishMode: true,
    target: republishTargetSnapshot,
    republishDryRunResult: result,
  });
  const expectedBeforeUpdatedAt = result.expectedBeforeUpdatedAt ?? null;

  el.innerHTML = `
    ${renderPreviewBadge()}
    ${renderWorkflowStepIndicator("republish", resolveWorkflowStep("republish"))}
    <h3 class="gosaki-schedule-edit-dry-run__title">再公開案の確認結果（保存前プレビュー）</h3>
    ${renderOperationKindHeader("republish")}
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    ${renderOperationSpecificNote("republish")}
    ${renderValidationWarningsList(result.validation.warnings)}
    ${result.validation.ok ? "" : renderGuardErrorList(result.guardErrors)}
    ${renderTargetIdentitySection({
      legacyId: result.target.legacy_id,
      targetId: result.target.id,
      date: result.target.date,
      title: result.target.title,
      publishedBefore: "false",
      publishedAfter: "true",
    })}
    ${renderPreviewSafetySection({
      operation: result.saveOperation,
      dryRun: true,
      actualWrite: false,
      wouldUpdate: result.wouldUpdate,
      wouldInsert: false,
      wouldDelete: false,
      physicalDelete: false,
      saveAllowed: gate.saveAllowed,
      saveEnabled: updateConfig.saveEnabled,
      approvalId: updateConfig.approvalId,
      expectedBeforeUpdatedAt,
    })}
    <p class="gosaki-schedule-edit-dry-run__note"><strong>publicReflectionPending:</strong> <code>true</code> — 公開サイトへの反映は別フェーズです。</p>
    ${renderOptimisticLockExplanation()}
    ${renderRepublishDryRunDevDetails(result)}
  `;
  updateSaveButtonState(null);
  updateSaveTargetPanel();
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
  const insertConfig = getG22dDuplicateInsertConfig();
  const gate = evaluateG22dDuplicateInsertUiGate({
    signedIn: stagingAuthSignedIn === true,
    duplicateMode: true,
    source: duplicateSourceSnapshot,
    duplicateDryRunResult: result,
  });

  el.innerHTML = `
    ${renderPreviewBadge()}
    ${renderWorkflowStepIndicator("duplicate", resolveWorkflowStep("duplicate"))}
    <h3 class="gosaki-schedule-edit-dry-run__title">複製案の確認結果（保存前プレビュー）</h3>
    ${renderOperationKindHeader("duplicate")}
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(result.message)}
    </p>
    ${renderOperationSpecificNote("duplicate")}
    <p class="gosaki-schedule-edit-dry-run__note">
      まだ保存されていません。保存は戸山が確認して反映します。
    </p>
    ${renderTargetIdentitySection({
      legacyId: result.source.legacy_id,
      targetId: result.source.id,
      date: result.source.date,
      title: result.source.title,
    })}
    <dl class="gosaki-schedule-edit-dry-run__target">
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
    ${renderPreviewSafetySection({
      operation: "duplicate",
      dryRun: true,
      actualWrite: false,
      wouldUpdate: false,
      wouldInsert: result.wouldInsert,
      wouldDelete: false,
      physicalDelete: false,
      saveAllowed: gate.saveAllowed,
      saveEnabled: insertConfig.saveEnabled,
      approvalId: insertConfig.approvalId,
    })}
    ${renderDuplicateDryRunDevDetails(result)}
  `;
  updateSaveButtonState(null);
  updateSaveTargetPanel();
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
  const existingConfig = getG9kExistingEventSaveButtonConfig();
  const gate = evaluateG9kOperatorSaveButtonUiGate({
    signedIn: stagingAuthSignedIn === true,
    selectedRow: selectedRowSnapshot,
    dryRunResult: result,
  });
  el.innerHTML = `
    ${renderPreviewBadge()}
    ${renderWorkflowStepIndicator("existing-update", resolveWorkflowStep("existing-update"))}
    <h3 class="gosaki-schedule-edit-dry-run__title">確認結果（保存前プレビュー）</h3>
    ${renderOperationKindHeader("existing-update")}
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(saveReadyMessage)}
    </p>
    ${renderOperationSpecificNote("existing-update")}
    ${renderTargetIdentitySection({
      legacyId: selectedRowSnapshot?.legacy_id ?? null,
      targetId: result.target.id,
      date: result.target.date,
      title: result.target.title,
    })}
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">変更されるフィールド</span>
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
    ${renderPreviewSafetySection({
      operation: "existing-update",
      dryRun: true,
      actualWrite: false,
      wouldUpdate: true,
      wouldInsert: false,
      wouldDelete: false,
      physicalDelete: false,
      saveAllowed: gate.saveAllowed,
      saveEnabled: existingConfig.saveEnabled,
      approvalId: result.approvalId,
      expectedBeforeUpdatedAt: result.expectedBeforeUpdatedAt,
    })}
    ${renderOptimisticLockExplanation()}
    ${renderDryRunOutcomeNote(result.saveReadiness)}
  `;
  updateSaveTargetPanel();
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
    ${renderSaveResultBadge()}
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "保存成功" : "保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの更新が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    ${renderOperationKindHeader("existing-update")}
    ${renderTargetIdentitySection({
      legacyId: outcome.beforeRecord?.legacy_id,
      targetId: outcome.beforeRecord?.id,
      date: outcome.beforeRecord?.date,
      title: outcome.afterRecord?.title ?? outcome.beforeRecord?.title,
    })}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>rowsAffected</dt><dd><code>${escapeHtml(rowsAffected)}</code></dd></div>
      <div><dt>保存前 updated_at（before updated_at）</dt><dd><code>${escapeHtml(outcome.beforeRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>保存後 updated_at（saved updated_at）</dt><dd><code>${escapeHtml(outcome.afterRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>optimistic lock 基準（expectedBeforeUpdatedAt）</dt><dd><code>${escapeHtml(outcome.expectedBeforeUpdatedAt ?? "—")}</code></dd></div>
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
    ${renderOptimisticLockExplanation()}
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
    ${renderSaveResultBadge()}
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "新規追加案の保存成功" : "新規追加案を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの追加（INSERT）が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    ${renderOperationKindHeader("new-event")}
    ${renderTargetIdentitySection({
      legacyId: outcome.legacy_id,
      targetId: outcome.insertedId,
      title: outcome.legacy_id,
    })}
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
    ${renderSaveResultBadge()}
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "複製案の保存成功" : "複製案を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースへの追加（INSERT）が完了しました。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    ${renderOperationKindHeader("duplicate")}
    ${renderTargetIdentitySection({
      legacyId: outcome.legacy_id,
      targetId: outcome.insertedId,
    })}
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
    ${renderSaveResultBadge()}
    <h3 class="gosaki-schedule-edit-save-result__title">${success ? "非公開化の保存成功" : "非公開化を保存できませんでした"}</h3>
    ${
      success
        ? `<p class="gosaki-schedule-edit-save-result__success">データベースの published を false に更新しました（物理削除は行っていません）。</p>`
        : ""
    }
    ${outcome.errorMessage ? `<p class="gosaki-schedule-edit-save-result__message">${escapeHtml(outcome.errorMessage)}</p>` : ""}
    ${renderOperationKindHeader("unpublish")}
    ${renderOperationSpecificNote("unpublish")}
    ${renderTargetIdentitySection({
      legacyId: outcome.targetLegacyId,
      targetId: outcome.targetId,
      title: outcome.beforeRecord?.title,
      date: outcome.beforeRecord?.date,
      publishedBefore: String(outcome.beforeRecord?.published ?? "true"),
      publishedAfter: String(outcome.afterRecord?.published ?? "false"),
    })}
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>operation</dt><dd><code>${escapeHtml(outcome.operation)}</code></dd></div>
      <div><dt>approvalId</dt><dd><code>${escapeHtml(outcome.approvalId)}</code></dd></div>
      <div><dt>保存前 updated_at（before updated_at）</dt><dd><code>${escapeHtml(outcome.beforeRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>保存後 updated_at（saved updated_at）</dt><dd><code>${escapeHtml(outcome.afterRecord?.updated_at ?? "—")}</code></dd></div>
      <div><dt>optimistic lock 基準（expectedBeforeUpdatedAt）</dt><dd><code>${escapeHtml(outcome.expectedBeforeUpdatedAt ?? "—")}</code></dd></div>
      <div><dt>wouldDelete</dt><dd><code>false</code></dd></div>
      <div><dt>physicalDelete</dt><dd><code>false</code></dd></div>
      <div><dt>actualWrite</dt><dd><code>${String(outcome.actualWrite)}</code></dd></div>
    </dl>
    ${renderOptimisticLockExplanation()}
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

  if (isRepublishDraftMode()) {
    if (!republishTargetSnapshot || !republishDraftState) {
      window.alert("再公開対象の公演が見つかりません。再度「再公開案を作成」を押してください。");
      return;
    }

    const signedIn = await refreshStagingAuthSignedIn();
    const result = executeG22hScheduleRepublishDryRun({
      target: republishTargetSnapshot,
      expectedBeforeUpdatedAt: republishDraftState.expectedBeforeUpdatedAt,
      expectedLegacyId: republishDraftState.targetLegacyId,
      signedIn,
      supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
    });
    lastRepublishDryRunResult = result;
    lastDryRunResult = null;
    lastDuplicateDryRunResult = null;
    lastNewEventDryRunResult = null;
    lastUnpublishDryRunResult = null;
    renderRepublishDryRunResult(result);
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
  if (isRepublishDraftMode()) {
    window.alert(
      "再公開の保存は G-22h6 以降で有効化されます。現在は「変更を確認」まで利用できます（DBは変わりません）。公開サイトへの反映は別フェーズです。",
    );
    return;
  }

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
      window.alert("先に「変更を確認」で非公開化案の内容を確認してください。");
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
      window.alert("先に「変更を確認」で新規追加案の内容を確認してください。");
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
      window.alert("先に「変更を確認」で複製案の内容を確認してください。");
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
    window.alert("先に「変更を確認」で内容を確認してください。");
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
      '<tr><td colspan="8" class="admin-gosaki-schedule-table__empty">該当する公演はありません。</td></tr>';
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
        <td class="admin-gosaki-schedule-table__legacy-col">${renderLegacyIdCode(row.legacy_id)}</td>
        <td class="admin-gosaki-schedule-table__title-col">${escapeHtml(displayValue(row.title))}</td>
        <td>${escapeHtml(displayValue(row.venue))}</td>
        <td>${escapeHtml(displayValue(row.open_time))}</td>
        <td>${escapeHtml(displayValue(row.start_time))}</td>
        <td>${escapeHtml(displayValue(row.price))}</td>
        <td class="admin-gosaki-schedule-table__actions-col">${renderScheduleTableRowActions(row, selected)}</td>
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
        <p class="gosaki-schedule-admin-card__legacy">${renderLegacyIdCode(row.legacy_id)}</p>
        <p class="gosaki-schedule-admin-card__title">${escapeHtml(displayValue(row.title))}</p>
        <p class="gosaki-schedule-admin-card__venue">${escapeHtml(displayValue(row.venue))}</p>
        <p class="gosaki-schedule-admin-card__times">${escapeHtml(formatTimes(row))}</p>
        <p class="gosaki-schedule-admin-card__price">${escapeHtml(formatPriceLabel(row.price))}</p>
        <p class="gosaki-schedule-admin-card__updated">更新: <time datetime="${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}">${escapeHtml(formatUpdatedAtDisplay(row.updated_at))}</time></p>
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
      updateRepublishButtonState();
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

  if (isRepublishDraftMode()) {
    if (rowId === republishTargetSnapshot?.id) {
      selectedRowId = rowId;
      renderScheduleList();
      updateRepublishButtonState();
      updateUnpublishButtonState();
      return;
    }
    if (
      !window.confirm(
        "再公開案の編集をやめて、別の公演を選び直しますか？（再公開案は保存されません）",
      )
    ) {
      return;
    }
    resetRepublishDraftMode();
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
  updateRepublishButtonState();

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

function wireRepublishButton(): void {
  document
    .getElementById("gosaki-schedule-republish-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      enterRepublishDraftFromSelectedRow();
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
      "[data-gosaki-schedule-action-disabled]:not(#gosaki-schedule-update-btn):not(#gosaki-schedule-add-btn):not(#gosaki-schedule-unpublish-btn):not(#gosaki-schedule-republish-btn)",
    )
    .forEach((button) => {
      button.disabled = true;
      button.title = "この操作は準備中です";
    });
}

export async function initGosakiStagingScheduleOperatorUi(): Promise<void> {
  const root = getRoot();
  if (!root) return;

  ssrBootstrapRows = parseRowsDataset();
  selectableRows = [...ssrBootstrapRows];
  adminReadMode = "ssr-bootstrap";
  adminReadError = null;
  adminReadInFlight = false;
  renderOperatorReadSourceBanner();
  wireFilters();
  wireTableActions();
  wireAddForm();
  wireEditForm();
  wireSaveButton();
  wireDuplicateButton();
  wireAddButton();
  wireUnpublishButton();
  wireRepublishButton();
  wireDisabledActions();
  wireAdminReadRetryButton();
  subscribeScheduleOperatorAuthRefetch();
  await refreshStagingAuthSignedIn();
  if (stagingAuthSignedIn) {
    await runAuthenticatedAdminReadRefetch();
  }
  renderScheduleList();
  renderEditForm(null);
  updateUnpublishButtonState();
  updateRepublishButtonState();
  updateSaveTargetPanel();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    void initGosakiStagingScheduleOperatorUi();
  });
}
