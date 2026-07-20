/**
 * G-20u45 — Gosaki Schedule operational view/edit/create client (package-safe).
 * Local dry-run preview only · Save default disabled · no network on display/input.
 */

export type ScheduleOperationalEvent = {
  id?: string | null;
  legacyId?: string | null;
  date?: string | null;
  yearMonth?: string | null;
  title?: string | null;
  venue?: string | null;
  openTime?: string | null;
  startTime?: string | null;
  price?: string | null;
  description?: string | null;
  published?: boolean;
  updatedAt?: string | null;
};

/** Existing-update safe fields (published allowed · date not editable). */
export const SCHEDULE_OPERATIONAL_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
] as const;

/**
 * Create local dry-run preview fields (G-22e new-event contract).
 * Includes date + published — not limited to existing-update safe fields.
 */
export const SCHEDULE_OPERATIONAL_CREATE_PREVIEW_FIELDS = [
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
] as const;

export type ScheduleOperationalSafeField =
  (typeof SCHEDULE_OPERATIONAL_SAFE_FIELDS)[number];

const CREATE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Local create payload preview — matches G-22e published=false guarantee. */
export function buildScheduleOperationalCreatePayloadPreview(
  after: Pick<
    FormSnapshot,
    "date" | "title" | "venue" | "open_time" | "start_time" | "price" | "description"
  >,
): {
  date: string;
  title: string;
  venue: string;
  open_time: string;
  start_time: string;
  price: string;
  description: string;
  published: false;
} {
  return {
    date: String(after.date ?? "").trim(),
    title: String(after.title ?? "").trim(),
    venue: String(after.venue ?? "").trim(),
    open_time: String(after.open_time ?? "").trim(),
    start_time: String(after.start_time ?? "").trim(),
    price: String(after.price ?? "").trim(),
    description: String(after.description ?? "").trim(),
    published: false,
  };
}

export type ScheduleEndpointRequestInput = {
  mode: "edit" | "create";
  id?: string | null;
  legacyId?: string | null;
  expectedBeforeUpdatedAt?: string | null;
  fields: {
    date?: string;
    open_time?: string;
    start_time?: string;
    title?: string;
    venue?: string;
    price?: string;
    description?: string;
    published?: boolean;
  };
};

export type ScheduleOperationalEditDeps = {
  /** Exact "true" only — default false / unset keeps Save disabled. */
  saveArmed?: boolean;
  getAccessToken?: () => Promise<string | null>;
  /** Staging schedule dry-run/Save Edge URL (empty = local preview only). */
  dryRunEndpoint?: string;
  anonKey?: string;
  assertDryRunEndpointSafe?: (endpoint: string) => boolean;
  assertSaveEndpointSafe?: (endpoint: string) => boolean;
  buildDryRunEndpointRequest?: (input: ScheduleEndpointRequestInput) => Record<string, unknown>;
  buildSaveEndpointRequest?: (input: ScheduleEndpointRequestInput) => Record<string, unknown>;
  sanitizeEndpointDisplay?: (
    body: unknown,
    httpStatus?: number,
  ) => {
    httpStatus?: number;
    ok?: boolean;
    operation?: string;
    mode?: string;
    dryRun?: boolean;
    wouldWrite?: boolean;
    changedFields?: string[];
    diffSummary?: unknown;
    expectedBeforeUpdatedAt?: string | null;
    target?: unknown;
    errors?: string[];
    warnings?: string[];
    didWrite: boolean;
    dbWrite: boolean;
    networkWrite: boolean;
    saveEnabled: boolean;
    authIssue?: boolean;
    unsafeWriteFlags?: boolean;
    fetchError?: string;
  };
  sanitizeSaveEndpointDisplay?: (
    body: unknown,
    httpStatus?: number,
  ) => {
    httpStatus?: number;
    ok?: boolean;
    operation?: string;
    mode?: string;
    dryRun?: boolean;
    wouldWrite?: boolean;
    changedFields?: string[];
    expectedBeforeUpdatedAt?: string | null;
    target?: unknown;
    errors?: string[];
    warnings?: string[];
    didWrite: boolean;
    dbWrite: boolean;
    networkWrite: boolean;
    saveEnabled: boolean;
    authIssue?: boolean;
    unsafeWriteFlags?: boolean;
    fetchError?: string;
  };
  evaluateSaveGate?: (input: {
    authenticated: boolean;
    dryRunSucceeded: boolean;
    formMatchesDryRunSnapshot: boolean;
    mode: "edit" | "create";
    expectedBeforeUpdatedAt: string | null;
    saveEndpointConfigured: boolean;
    saveEndpointSafe: boolean;
    envArmed: boolean;
    approvalId: string;
    expectedApprovalId: string;
    saveInFlight: boolean;
  }) => { enabled: boolean; reason: string };
  isSaveConflictResponse?: (body: unknown) => boolean;
  dryRunOperation?: "dryRun";
  saveOperation?: "save";
  expectedSaveApprovalId?: string;
  conflictMessage?: string;
  productionProjectRefStop?: string;
  fetchImpl?: typeof fetch;
};

const UNSAVED_LEAVE = "未保存の変更があります。一覧へ戻ると破棄されます。続けますか？";

type Mode = "view" | "edit" | "create";

type FormSnapshot = {
  id: string;
  legacy_id: string;
  updated_at: string;
  mode: Mode;
  date: string;
  open_time: string;
  start_time: string;
  title: string;
  venue: string;
  price: string;
  description: string;
  published: boolean;
};

function readEventsJson(root: HTMLElement): ScheduleOperationalEvent[] {
  const el = root.querySelector("#gosaki-schedule-events-json, [data-gosaki-schedule-events-json]");
  if (!el) return [];
  try {
    const parsed = JSON.parse(el.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fieldEl(root: HTMLElement, name: string): HTMLElement | null {
  return root.querySelector(`[data-field="${name}"]`);
}

function readForm(root: HTMLElement): FormSnapshot {
  const get = (name: string) => {
    const el = fieldEl(root, name);
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") return el.checked ? "true" : "false";
      return el.value;
    }
    if (el instanceof HTMLTextAreaElement) return el.value;
    return "";
  };
  return {
    id: get("id"),
    legacy_id: get("legacy_id"),
    updated_at: get("updated_at"),
    mode: (get("mode") as Mode) || "edit",
    date: get("date"),
    open_time: get("open_time"),
    start_time: get("start_time"),
    title: get("title"),
    venue: get("venue"),
    price: get("price"),
    description: get("description"),
    published: get("published") === "true",
  };
}

function writeForm(root: HTMLElement, snap: Partial<FormSnapshot>): void {
  for (const [key, value] of Object.entries(snap)) {
    const el = fieldEl(root, key);
    if (!el) continue;
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.checked = Boolean(value);
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = value == null ? "" : String(value);
    }
  }
}

function eventToForm(event: ScheduleOperationalEvent, mode: Mode): FormSnapshot {
  return {
    id: String(event.id ?? ""),
    legacy_id: String(event.legacyId ?? ""),
    updated_at: String(event.updatedAt ?? ""),
    mode,
    date: String(event.date ?? ""),
    open_time: String(event.openTime ?? ""),
    start_time: String(event.startTime ?? ""),
    title: String(event.title ?? ""),
    venue: String(event.venue ?? ""),
    price: String(event.price ?? ""),
    description: String(event.description ?? ""),
    published: event.published !== false,
  };
}

function emptyCreateForm(): FormSnapshot {
  return {
    id: "",
    legacy_id: "",
    updated_at: "",
    mode: "create",
    date: "",
    open_time: "",
    start_time: "",
    title: "",
    venue: "",
    price: "",
    description: "",
    published: false,
  };
}

/** Duplicate opens create form with content copied; never mutates the source row. */
function duplicateToCreateForm(event: ScheduleOperationalEvent): FormSnapshot {
  return {
    id: "",
    legacy_id: "",
    updated_at: "",
    mode: "create",
    date: String(event.date ?? ""),
    open_time: String(event.openTime ?? ""),
    start_time: String(event.startTime ?? ""),
    title: String(event.title ?? ""),
    venue: String(event.venue ?? ""),
    price: String(event.price ?? ""),
    description: String(event.description ?? ""),
    published: false,
  };
}

function fingerprint(snap: FormSnapshot): string {
  return JSON.stringify({
    date: snap.date,
    open_time: snap.open_time,
    start_time: snap.start_time,
    title: snap.title,
    venue: snap.venue,
    price: snap.price,
    description: snap.description,
    published: snap.published,
  });
}

function diffSafeFields(
  before: FormSnapshot,
  after: FormSnapshot,
): Array<{ field: string; before: string; after: string }> {
  const out: Array<{ field: string; before: string; after: string }> = [];
  for (const field of SCHEDULE_OPERATIONAL_SAFE_FIELDS) {
    if (field === "published") {
      const b = before.published === true ? "true" : "false";
      const a = after.published === true ? "true" : "false";
      if (b !== a) out.push({ field, before: b, after: a });
      continue;
    }
    const b = String(before[field] ?? "");
    const a = String(after[field] ?? "");
    if (b !== a) out.push({ field, before: b, after: a });
  }
  return out;
}

/**
 * Local dry-run preview — no fetch / no DB write.
 * Existing edit requires expectedBeforeUpdatedAt when updated_at is present.
 * Create preview includes date + published=false (G-22e); does not invent fields.
 */
export function buildScheduleOperationalLocalDryRun(input: {
  mode: Mode;
  before: FormSnapshot;
  after: FormSnapshot;
  authenticated: boolean;
}): {
  ok: boolean;
  dryRun: true;
  wouldWrite: false;
  mode: Mode;
  changedFields: string[];
  expectedBeforeUpdatedAt: string | null;
  optimisticLockRequired: boolean;
  authRequired: boolean;
  saveAllowed: false;
  saveReadiness: "no_changes" | "guard_error" | "ready_but_save_disabled";
  diffs: Array<{ field: string; before: string; after: string }>;
  createPayloadPreview: ReturnType<
    typeof buildScheduleOperationalCreatePayloadPreview
  > | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (input.mode === "edit" && !input.after.id && !input.after.legacy_id) {
    errors.push("edit target id / legacy_id missing");
  }
  const expectedBeforeUpdatedAt =
    input.mode === "create"
      ? null
      : String(input.after.updated_at ?? "").trim() || null;
  const optimisticLockRequired = input.mode === "edit";
  if (optimisticLockRequired && !expectedBeforeUpdatedAt) {
    errors.push("expectedBeforeUpdatedAt is required for existing-event edit");
  }
  if (!input.authenticated) {
    errors.push("authenticated session required before Save (dry-run preview still available)");
  }

  const createPayloadPreview =
    input.mode === "create"
      ? buildScheduleOperationalCreatePayloadPreview(input.after)
      : null;

  if (input.mode === "create") {
    const date = createPayloadPreview?.date ?? "";
    if (!date) {
      errors.push("date is required for create");
    } else if (!CREATE_DATE_RE.test(date)) {
      errors.push("date must be YYYY-MM-DD");
    }
  }

  const diffs =
    input.mode === "create" && createPayloadPreview
      ? SCHEDULE_OPERATIONAL_CREATE_PREVIEW_FIELDS.map((field) => ({
          field,
          before: "",
          after:
            field === "published"
              ? "false"
              : String(createPayloadPreview[field] ?? ""),
        })).filter((d) => d.field === "published" || Boolean(d.after))
      : diffSafeFields(input.before, input.after);

  const changedFields = diffs.map((d) => d.field);
  if (changedFields.length === 0 && input.mode === "edit") {
    return {
      ok: true,
      dryRun: true,
      wouldWrite: false,
      mode: input.mode,
      changedFields: [],
      expectedBeforeUpdatedAt,
      optimisticLockRequired,
      authRequired: true,
      saveAllowed: false,
      saveReadiness: "no_changes",
      diffs: [],
      createPayloadPreview: null,
      errors,
    };
  }

  const guardError = errors.some(
    (e) =>
      e.includes("expectedBeforeUpdatedAt") ||
      e.includes("target") ||
      e.includes("date is required") ||
      e.includes("date must be YYYY-MM-DD"),
  );
  return {
    ok: !guardError,
    dryRun: true,
    wouldWrite: false,
    mode: input.mode,
    changedFields,
    expectedBeforeUpdatedAt,
    optimisticLockRequired,
    authRequired: true,
    saveAllowed: false,
    saveReadiness: guardError ? "guard_error" : "ready_but_save_disabled",
    diffs,
    createPayloadPreview,
    errors,
  };
}

export function initGosakiScheduleOperationalEdit(
  root: HTMLElement,
  deps: ScheduleOperationalEditDeps = {},
): void {
  const events = readEventsJson(root);
  const viewMode = root.querySelector("[data-gosaki-schedule-view-mode]");
  const editMode = root.querySelector("[data-gosaki-schedule-edit-mode]");
  const viewToolbar = root.querySelector("[data-gosaki-schedule-view-toolbar]");
  const unsavedBanner = root.querySelector("[data-gosaki-schedule-unsaved-banner]");
  const dryRunResult = root.querySelector("[data-gosaki-schedule-dry-run-result]");
  const lockValue = root.querySelector("[data-gosaki-schedule-lock-value]");
  const editLead = root.querySelector("[data-gosaki-schedule-edit-lead]");
  const saveBtn = root.querySelector("[data-gosaki-schedule-save]");
  const saveReasonEl = root.querySelector("[data-gosaki-schedule-save-reason]");
  const statusEl = root.querySelector("[data-gosaki-schedule-status]");

  let mode: Mode = "view";
  let baseline: FormSnapshot | null = null;
  let dryRunFingerprint: string | null = null;
  let dryRunOk = false;
  let dryRunExpectedLock: string | null = null;
  let dryRunMode: "edit" | "create" | null = null;
  let saveInFlight = false;
  let dryRunInFlight = false;

  const saveArmed = deps.saveArmed === true;
  const dryRunOperation = deps.dryRunOperation ?? "dryRun";
  const saveOperation = deps.saveOperation ?? "save";
  const expectedSaveApprovalId = String(deps.expectedSaveApprovalId ?? "").trim();
  const conflictMessage =
    deps.conflictMessage ??
    "他の場所で更新された可能性があります。再読み込みしてください。";
  const productionStop = deps.productionProjectRefStop ?? "vsbvndwuajjhnzpohghh";
  const fetchImpl = deps.fetchImpl ?? fetch;
  const SAVE_LABEL_ENABLED = "更新する";
  const SAVE_LABEL_DISABLED = "更新する（無効）";

  function setUnsaved(visible: boolean) {
    if (!(unsavedBanner instanceof HTMLElement)) return;
    unsavedBanner.hidden = !visible;
  }

  function currentDirty(): boolean {
    if (!baseline || mode === "view") return false;
    return fingerprint(readForm(root)) !== fingerprint(baseline);
  }

  function invalidateDryRun() {
    dryRunOk = false;
    dryRunFingerprint = null;
    dryRunExpectedLock = null;
    dryRunMode = null;
    if (dryRunResult instanceof HTMLElement) {
      dryRunResult.hidden = true;
      dryRunResult.innerHTML = "";
    }
    void refreshSaveGate();
  }

  function applySaveButtonUi(enabled: boolean, reason: string) {
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    // Fail-closed: disable first, then enable only when arm + gate both pass.
    // Endpoint dry-run saveEnabled=false is a response contract — NOT a UI gate.
    saveBtn.disabled = true;
    if (enabled) saveBtn.disabled = false;
    saveBtn.setAttribute("data-gosaki-save-allowed", enabled ? "true" : "false");
    saveBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    saveBtn.textContent = enabled ? SAVE_LABEL_ENABLED : SAVE_LABEL_DISABLED;
    saveBtn.title = enabled
      ? "保存できます（operator 明示操作のみ）"
      : reason || "Save は無効です（通常 STG package）";
    if (saveReasonEl instanceof HTMLElement) {
      saveReasonEl.textContent = enabled
        ? "保存できます（operator 明示操作のみ）"
        : reason || "Save は無効です";
    }
    if (statusEl instanceof HTMLElement && mode !== "view") {
      statusEl.textContent = enabled
        ? mode === "create"
          ? "新規予定 · Save 可能"
          : "公演を編集中 · Save 可能"
        : mode === "create"
          ? "新規予定を入力中 · Save 無効"
          : "公演を編集中 · Save 無効";
    }
  }

  async function refreshSaveGate() {
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    const after = mode === "view" ? null : readForm(root);
    const runMode: "edit" | "create" =
      after?.mode === "create" ? "create" : "edit";
    const token = (await (deps.getAccessToken?.() ?? Promise.resolve(null))) || null;
    const endpoint = String(deps.dryRunEndpoint ?? "").trim();
    const formMatches =
      dryRunOk &&
      dryRunFingerprint != null &&
      after != null &&
      dryRunFingerprint === fingerprint(after) &&
      (dryRunMode == null || dryRunMode === runMode);
    const gate = deps.evaluateSaveGate
      ? deps.evaluateSaveGate({
          authenticated: Boolean(token),
          dryRunSucceeded: dryRunOk,
          formMatchesDryRunSnapshot: formMatches,
          mode: runMode,
          expectedBeforeUpdatedAt:
            runMode === "edit"
              ? dryRunExpectedLock || after?.updated_at || null
              : null,
          saveEndpointConfigured: Boolean(endpoint && deps.anonKey),
          saveEndpointSafe: endpoint
            ? (deps.assertSaveEndpointSafe ?? deps.assertDryRunEndpointSafe)?.(endpoint) !==
              false
            : false,
          envArmed: saveArmed,
          approvalId: expectedSaveApprovalId,
          expectedApprovalId: expectedSaveApprovalId,
          saveInFlight,
        })
      : { enabled: false, reason: "Save gate not wired" };

    // Normal STG: saveArmed false → always disabled. Local arm + all gates → enable.
    // Do NOT require endpoint response saveEnabled===true (dry-run contract keeps it false).
    const enabled = saveArmed === true && gate.enabled === true;
    applySaveButtonUi(enabled, gate.reason || "Save は無効です（通常 STG package）");
  }

  function showView() {
    mode = "view";
    root.dataset.mode = "view";
    if (viewMode instanceof HTMLElement) viewMode.hidden = false;
    if (editMode instanceof HTMLElement) editMode.hidden = true;
    if (viewToolbar instanceof HTMLElement) viewToolbar.hidden = false;
    baseline = null;
    setUnsaved(false);
    invalidateDryRun();
    if (statusEl) statusEl.textContent = "公演の確認・追加・編集ができます";
  }

  function applyModeFieldLocks(next: Mode) {
    const dateEl = fieldEl(root, "date");
    const publishedEl = fieldEl(root, "published");
    const dateNote = root.querySelector("[data-gosaki-schedule-date-edit-note]");
    const publishedLabel = root.querySelector("[data-gosaki-schedule-published-label]");
    if (dateEl instanceof HTMLInputElement) {
      // Edit: date locked (legacy_id month alignment TBD). Create: editable + required.
      dateEl.disabled = next === "edit";
      dateEl.readOnly = next === "edit";
    }
    if (dateNote instanceof HTMLElement) {
      dateNote.hidden = next !== "edit";
      dateNote.textContent = "既存予定の日付変更は現在未対応";
    }
    if (publishedEl instanceof HTMLInputElement) {
      if (next === "create") {
        publishedEl.checked = false;
        publishedEl.disabled = true;
      } else {
        publishedEl.disabled = false;
      }
    }
    if (publishedLabel instanceof HTMLElement) {
      publishedLabel.textContent =
        next === "create" ? "非公開で作成（公開は作成後の編集で）" : "公開する";
    }
  }

  function showEditor(next: Mode, snap: FormSnapshot, lead: string) {
    mode = next;
    root.dataset.mode = next;
    if (viewMode instanceof HTMLElement) viewMode.hidden = true;
    if (editMode instanceof HTMLElement) editMode.hidden = false;
    if (viewToolbar instanceof HTMLElement) viewToolbar.hidden = true;
    writeForm(root, snap);
    applyModeFieldLocks(next);
    baseline = { ...snap };
    invalidateDryRun();
    if (lockValue) {
      if (next === "create") {
        lockValue.textContent = "新規作成のため対象外";
      } else {
        lockValue.textContent = snap.updated_at || "—";
      }
    }
    if (editLead) editLead.textContent = lead;
    setUnsaved(false);
    invalidateDryRun();
    if (statusEl) {
      statusEl.textContent =
        next === "create"
          ? "新規予定を入力中 · Save 無効"
          : "公演を編集中 · Save 無効";
    }
    void refreshSaveGate();
  }

  function findEvent(id: string, legacyId: string): ScheduleOperationalEvent | null {
    return (
      events.find(
        (e) =>
          (id && String(e.id ?? "") === id) ||
          (legacyId && String(e.legacyId ?? "") === legacyId),
      ) ?? null
    );
  }

  function confirmLeaveIfDirty(): boolean {
    if (!currentDirty()) return true;
    return window.confirm(UNSAVED_LEAVE);
  }

  function applyScheduleSearch(rawQuery: string) {
    const query = String(rawQuery ?? "").trim().toLowerCase();
    const cards = root.querySelectorAll<HTMLElement>("[data-schedule-event]");
    const months = root.querySelectorAll<HTMLElement>("[data-schedule-month]");
    const countEl = root.querySelector("[data-gosaki-schedule-search-count]");
    const clearBtn = root.querySelector("[data-gosaki-schedule-search-clear]");
    const emptyEl = root.querySelector("[data-gosaki-schedule-search-empty]");
    let visible = 0;

    cards.forEach((card) => {
      const hay = String(card.getAttribute("data-search-text") || "").toLowerCase();
      const match = !query || hay.includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });

    months.forEach((month) => {
      const anyVisible = Array.from(
        month.querySelectorAll<HTMLElement>("[data-schedule-event]"),
      ).some((card) => !card.hidden);
      month.hidden = !anyVisible;
    });

    if (countEl) {
      countEl.textContent = query
        ? `${visible} / ${cards.length} 件（検索中）`
        : `全 ${cards.length} 件`;
    }
    if (clearBtn instanceof HTMLElement) {
      clearBtn.hidden = !query;
    }
    if (emptyEl instanceof HTMLElement) {
      emptyEl.hidden = !(query && visible === 0);
    }
  }

  root.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;

    const editEventBtn = t.closest("[data-gosaki-schedule-edit-event]");
    if (editEventBtn instanceof HTMLElement) {
      if (!confirmLeaveIfDirty()) return;
      const id = editEventBtn.getAttribute("data-event-id") || "";
      const legacyId = editEventBtn.getAttribute("data-legacy-id") || "";
      const event = findEvent(id, legacyId);
      if (!event) return;
      showEditor("edit", eventToForm(event, "edit"), `編集: ${event.title || event.legacyId || "公演"}`);
      return;
    }

    const dupEventBtn = t.closest("[data-gosaki-schedule-duplicate-event]");
    if (dupEventBtn instanceof HTMLElement) {
      if (!confirmLeaveIfDirty()) return;
      const id = dupEventBtn.getAttribute("data-event-id") || "";
      const legacyId = dupEventBtn.getAttribute("data-legacy-id") || "";
      const event = findEvent(id, legacyId);
      if (!event) return;
      showEditor(
        "create",
        duplicateToCreateForm(event),
        `複製して追加: ${event.title || event.legacyId || "公演"}`,
      );
      return;
    }

    if (t.closest("[data-gosaki-schedule-create-start]")) {
      if (!confirmLeaveIfDirty()) return;
      showEditor("create", emptyCreateForm(), "新しい予定を追加");
      return;
    }

    if (t.closest("[data-gosaki-schedule-search-clear]")) {
      const searchInput = root.querySelector("[data-gosaki-schedule-search-input]");
      if (searchInput instanceof HTMLInputElement) {
        searchInput.value = "";
        applyScheduleSearch("");
      }
      return;
    }

    if (t.closest("[data-gosaki-edit-cancel]")) {
      if (!confirmLeaveIfDirty()) return;
      showView();
      return;
    }

    if (t.closest("[data-gosaki-edit-dry-run]")) {
      if (dryRunInFlight) return;
      const after = readForm(root);
      const before = baseline ?? after;
      const runMode: "edit" | "create" = after.mode === "create" ? "create" : "edit";

      void (async () => {
        const token = (await (deps.getAccessToken?.() ?? Promise.resolve(null))) || null;
        const local = buildScheduleOperationalLocalDryRun({
          mode: runMode,
          before,
          after,
          authenticated: Boolean(token),
        });

        const renderCard = (opts: {
          title: string;
          source: string;
          httpStatus?: number | string;
          endpoint?: Record<string, unknown> | null;
          preflightErrors?: string[];
          saveUiNote?: string;
        }) => {
          if (!(dryRunResult instanceof HTMLElement)) return;
          dryRunResult.hidden = false;
          const rows = local.diffs
            .map(
              (d) =>
                `<tr><th>${escapeHtml(d.field)}</th><td>${escapeHtml(d.before || "—")}</td><td>${escapeHtml(d.after || "—")}</td></tr>`,
            )
            .join("");
          const endpoint = opts.endpoint;
          const endpointErrors = Array.isArray(endpoint?.errors)
            ? (endpoint.errors as string[])
            : [];
          const endpointWarnings = Array.isArray(endpoint?.warnings)
            ? (endpoint.warnings as string[])
            : [];
          const allErrors = [...(opts.preflightErrors ?? []), ...local.errors, ...endpointErrors];
          const createNote =
            local.mode === "create" && local.createPayloadPreview
              ? `<p>create payload preview · date=<code>${escapeHtml(local.createPayloadPreview.date || "—")}</code> · published=<code>false</code>（G-22e）</p>`
              : "";
          const target =
            endpoint?.target && typeof endpoint.target === "object"
              ? (endpoint.target as Record<string, unknown>)
              : null;
          dryRunResult.innerHTML = `
            <h3>${escapeHtml(opts.title)}</h3>
            <p>source=<code>${escapeHtml(opts.source)}</code> · mode=<code>${escapeHtml(runMode)}</code> · httpStatus=<code>${escapeHtml(String(opts.httpStatus ?? "—"))}</code></p>
            <p>target id=<code>${escapeHtml(String((target?.id ?? after.id) || "—"))}</code> · legacyId=<code>${escapeHtml(String((target?.legacyId ?? after.legacy_id) || "—"))}</code></p>
            <p>expectedBeforeUpdatedAt: <code>${escapeHtml(String((endpoint?.expectedBeforeUpdatedAt ?? local.expectedBeforeUpdatedAt) || "—"))}</code></p>
            <p>changedFields: ${escapeHtml(
              (Array.isArray(endpoint?.changedFields)
                ? (endpoint.changedFields as string[])
                : local.changedFields
              ).join(", ") || "なし",
            )}</p>
            <p>didWrite=<code>false</code> · dbWrite=<code>false</code> · networkWrite=<code>false</code> · saveEnabled=<code>false</code>（Endpoint 契約 · UI gate ではない）</p>
            ${createNote}
            ${
              allErrors.length
                ? `<ul>${allErrors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
                : ""
            }
            ${
              endpointWarnings.length
                ? `<ul>${endpointWarnings.map((e) => `<li>warning: ${escapeHtml(e)}</li>`).join("")}</ul>`
                : ""
            }
            <table><thead><tr><th>field</th><th>before</th><th>after</th></tr></thead><tbody>${rows || "<tr><td colspan=3>差分なし</td></tr>"}</tbody></table>
            <p role="note">${escapeHtml(
              opts.saveUiNote ??
                (opts.source === "endpoint" && !allErrors.length
                  ? saveArmed
                    ? "dry-run 成功。フォームが一致する間「更新する」が有効になります（operation=save は未送信）。"
                    : "dry-run 成功。通常 package では Save は無効のままです（env arm なし）。"
                  : "Save は無効です。operation=save は送信しません。"),
            )}</p>
          `;
        };

        const endpoint = String(deps.dryRunEndpoint ?? "").trim();
        const anonKey = String(deps.anonKey ?? "").trim();
        const endpointConfigured = Boolean(endpoint && anonKey);

        if (!endpointConfigured) {
          dryRunOk = local.ok && local.saveReadiness !== "guard_error";
          dryRunFingerprint = fingerprint(after);
          dryRunMode = dryRunOk ? runMode : null;
          dryRunExpectedLock =
            dryRunOk && runMode === "edit"
              ? String(local.expectedBeforeUpdatedAt ?? "").trim() || null
              : null;
          renderCard({
            title: "変更を確認（ローカル dry-run）",
            source: "local",
            preflightErrors: ["network dry-run未設定（Endpoint URL / anon key）— local preview のみ"],
            saveUiNote: dryRunOk
              ? saveArmed
                ? "ローカル dry-run 成功。ただし network dry-run 未設定のため Save は有効化しません。"
                : "ローカル dry-run 成功。通常 package では Save は無効のままです。"
              : "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        if (endpoint.includes(productionStop) || deps.assertDryRunEndpointSafe?.(endpoint) === false) {
          dryRunOk = false;
          dryRunFingerprint = null;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（network dry-run blocked）",
            source: "endpoint",
            preflightErrors: ["Production endpoint blocked — staging only"],
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        if (!token) {
          dryRunOk = false;
          dryRunFingerprint = null;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（auth required）",
            source: "endpoint",
            preflightErrors: ["access token required — network dry-run not sent"],
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        if (runMode === "edit" && !local.expectedBeforeUpdatedAt) {
          dryRunOk = false;
          dryRunFingerprint = null;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（lock required）",
            source: "endpoint",
            preflightErrors: ["expectedBeforeUpdatedAt missing — edit network dry-run not sent"],
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        if (runMode === "create") {
          const date = String(after.date ?? "").trim();
          if (!date || !CREATE_DATE_RE.test(date)) {
            dryRunOk = false;
            dryRunFingerprint = null;
            dryRunMode = null;
            renderCard({
              title: "変更を確認（create validation）",
              source: "endpoint",
              preflightErrors: ["create requires date YYYY-MM-DD — network dry-run not sent"],
              saveUiNote: "Save は無効です。operation=save は送信しません。",
            });
            setUnsaved(currentDirty());
            void refreshSaveGate();
            return;
          }
        }

        if (!deps.buildDryRunEndpointRequest || !deps.sanitizeEndpointDisplay) {
          dryRunOk = false;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（wiring incomplete）",
            source: "endpoint",
            preflightErrors: ["dry-run request builder not wired"],
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        const payload = deps.buildDryRunEndpointRequest({
          mode: runMode,
          id: after.id,
          legacyId: after.legacy_id,
          expectedBeforeUpdatedAt: local.expectedBeforeUpdatedAt,
          fields: {
            ...(runMode === "create" ? { date: after.date } : {}),
            open_time: after.open_time,
            start_time: after.start_time,
            title: after.title,
            venue: after.venue,
            price: after.price,
            description: after.description,
            published: runMode === "create" ? false : after.published === true,
          },
        });

        if (payload.operation !== dryRunOperation) {
          dryRunOk = false;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（operation rejected）",
            source: "endpoint",
            preflightErrors: ["operation must be dryRun only — request not sent"],
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
          setUnsaved(currentDirty());
          void refreshSaveGate();
          return;
        }

        dryRunInFlight = true;
        dryRunOk = false;
        dryRunFingerprint = null;
        dryRunMode = null;
        if (dryRunResult instanceof HTMLElement) {
          dryRunResult.hidden = false;
          dryRunResult.innerHTML = "<p>Endpoint dry-run 送信中…（DB write なし · Save 一時無効）</p>";
        }
        void refreshSaveGate();

        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 20000);
          const res = await fetchImpl(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
              apikey: anonKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          window.clearTimeout(timeoutId);
          let data: unknown = {};
          try {
            data = await res.json();
          } catch {
            data = { ok: false, errors: ["non-JSON response"] };
          }
          const display = deps.sanitizeEndpointDisplay(data, res.status);
          const endpointErrors = Array.isArray(display.errors) ? display.errors : [];
          const changedFields = Array.isArray(display.changedFields)
            ? display.changedFields
            : [];
          const changedFieldsSafe =
            changedFields.length === 0 ||
            changedFields.every(
              (field) =>
                (SCHEDULE_OPERATIONAL_SAFE_FIELDS as readonly string[]).includes(field) ||
                (runMode === "create" &&
                  (SCHEDULE_OPERATIONAL_CREATE_PREVIEW_FIELDS as readonly string[]).includes(
                    field,
                  )),
            );
          const modeMatches = !display.mode || display.mode === runMode;
          // saveEnabled=false is the dry-run response contract. Never require
          // saveEnabled=true to arm UI Save (that would treat a write claim as readiness).
          const endpointOk =
            display.ok === true &&
            display.didWrite === false &&
            display.dbWrite === false &&
            display.networkWrite === false &&
            display.saveEnabled === false &&
            !display.unsafeWriteFlags &&
            endpointErrors.length === 0 &&
            changedFieldsSafe &&
            modeMatches &&
            (display.operation === dryRunOperation || display.dryRun === true);
          dryRunOk = endpointOk;
          dryRunFingerprint = endpointOk ? fingerprint(after) : null;
          dryRunMode = endpointOk ? runMode : null;
          dryRunExpectedLock =
            endpointOk && runMode === "edit"
              ? String(
                  display.expectedBeforeUpdatedAt ?? local.expectedBeforeUpdatedAt ?? "",
                ).trim() || null
              : null;
          renderCard({
            title: endpointOk
              ? "変更を確認（endpoint dry-run）"
              : "変更を確認（endpoint dry-run FAIL）",
            source: "endpoint",
            httpStatus: display.httpStatus ?? res.status,
            endpoint: display as unknown as Record<string, unknown>,
            saveUiNote: endpointOk
              ? saveArmed
                ? "dry-run 成功。フォームが一致する間「更新する」が有効になります（operation=save は未送信）。"
                : "dry-run 成功。通常 package では Save は無効のままです（env arm なし）。"
              : "Save は無効です。operation=save は送信しません。",
          });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.name === "AbortError"
                ? "timeout / aborted"
                : err.message
              : String(err);
          dryRunOk = false;
          dryRunFingerprint = null;
          dryRunExpectedLock = null;
          dryRunMode = null;
          renderCard({
            title: "変更を確認（network error）",
            source: "endpoint",
            preflightErrors: [`network error: ${message}`],
            endpoint: {
              ok: false,
              fetchError: message,
              didWrite: false,
              dbWrite: false,
              networkWrite: false,
              saveEnabled: false,
            },
            saveUiNote: "Save は無効です。operation=save は送信しません。",
          });
        } finally {
          dryRunInFlight = false;
          setUnsaved(currentDirty());
          void refreshSaveGate();
        }
      })();
      return;
    }

    if (t.closest("[data-gosaki-schedule-save]")) {
      if (saveInFlight || dryRunInFlight) return;
      if (!(saveBtn instanceof HTMLButtonElement) || saveBtn.disabled) return;

      void (async () => {
        const after = readForm(root);
        const runMode: "edit" | "create" = after.mode === "create" ? "create" : "edit";
        const token = (await (deps.getAccessToken?.() ?? Promise.resolve(null))) || null;
        const endpoint = String(deps.dryRunEndpoint ?? "").trim();
        const anonKey = String(deps.anonKey ?? "").trim();

        const formMatches =
          dryRunOk &&
          dryRunFingerprint != null &&
          dryRunFingerprint === fingerprint(after);
        const gate = deps.evaluateSaveGate?.({
          authenticated: Boolean(token),
          dryRunSucceeded: dryRunOk,
          formMatchesDryRunSnapshot: formMatches,
          mode: runMode,
          expectedBeforeUpdatedAt:
            runMode === "edit"
              ? dryRunExpectedLock || after.updated_at || null
              : null,
          saveEndpointConfigured: Boolean(endpoint && anonKey),
          saveEndpointSafe: endpoint
            ? (deps.assertSaveEndpointSafe ?? deps.assertDryRunEndpointSafe)?.(endpoint) !==
              false
            : false,
          envArmed: saveArmed,
          approvalId: expectedSaveApprovalId,
          expectedApprovalId: expectedSaveApprovalId,
          saveInFlight: false,
        });

        if (!saveArmed || !gate?.enabled || !token || !deps.buildSaveEndpointRequest) {
          void refreshSaveGate();
          return;
        }

        if (endpoint.includes(productionStop)) {
          if (dryRunResult instanceof HTMLElement) {
            dryRunResult.hidden = false;
            dryRunResult.innerHTML = `<p role="alert">Production endpoint blocked — Save not sent</p>`;
          }
          return;
        }

        const requestBody = deps.buildSaveEndpointRequest({
          mode: runMode,
          id: after.id,
          legacyId: after.legacy_id,
          expectedBeforeUpdatedAt:
            runMode === "edit"
              ? dryRunExpectedLock || after.updated_at || null
              : null,
          fields: {
            ...(runMode === "create" ? { date: after.date } : {}),
            open_time: after.open_time,
            start_time: after.start_time,
            title: after.title,
            venue: after.venue,
            price: after.price,
            description: after.description,
            published: runMode === "create" ? false : after.published === true,
          },
        });

        if (String(requestBody.operation ?? "") !== saveOperation) {
          if (dryRunResult instanceof HTMLElement) {
            dryRunResult.hidden = false;
            dryRunResult.innerHTML = `<p role="alert">Save blocked — operation must be ${escapeHtml(saveOperation)}</p>`;
          }
          return;
        }

        saveInFlight = true;
        void refreshSaveGate();
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 20000);
        try {
          const res = await fetchImpl(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKey,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
          window.clearTimeout(timeoutId);
          let data: unknown = {};
          try {
            data = await res.json();
          } catch {
            data = { ok: false, errors: ["non-JSON response"] };
          }

          if (deps.isSaveConflictResponse?.(data) || res.status === 409) {
            invalidateDryRun();
            if (dryRunResult instanceof HTMLElement) {
              dryRunResult.hidden = false;
              dryRunResult.innerHTML = `<p role="alert">${escapeHtml(conflictMessage)}</p>`;
            }
            return;
          }

          const display = deps.sanitizeSaveEndpointDisplay
            ? deps.sanitizeSaveEndpointDisplay(data, res.status)
            : {
                ok: false,
                didWrite: false,
                dbWrite: false,
                networkWrite: false,
                saveEnabled: false,
                errors: ["Save display sanitizer not wired"],
                httpStatus: res.status,
              };

          if (dryRunResult instanceof HTMLElement) {
            dryRunResult.hidden = false;
            const target =
              display.target && typeof display.target === "object"
                ? (display.target as Record<string, unknown>)
                : null;
            const errList = Array.isArray(display.errors) ? display.errors : [];
            if (display.ok === true && display.didWrite === true) {
              const newUpdatedAt = String(target?.updatedAt ?? "").trim();
              if (runMode === "edit" && newUpdatedAt) {
                after.updated_at = newUpdatedAt;
                writeForm(root, after);
                baseline = { ...after };
                if (lockValue) lockValue.textContent = newUpdatedAt;
              }
              dryRunResult.innerHTML = `
                <h3>保存成功（endpoint Save）</h3>
                <p>mode=<code>${escapeHtml(runMode)}</code> · httpStatus=<code>${escapeHtml(String(display.httpStatus ?? res.status))}</code></p>
                <p>target id=<code>${escapeHtml(String(target?.id || "—"))}</code> · legacyId=<code>${escapeHtml(String(target?.legacyId || "—"))}</code></p>
                <p>updatedAt=<code>${escapeHtml(String(target?.updatedAt || "—"))}</code></p>
                <p>changedFields: ${escapeHtml((display.changedFields ?? []).join(", ") || "なし")}</p>
                <p>didWrite=<code>true</code> · dbWrite=<code>true</code> · networkWrite=<code>true</code></p>
              `;
              dryRunOk = false;
              dryRunFingerprint = null;
              dryRunExpectedLock = null;
              setUnsaved(false);
            } else {
              dryRunResult.innerHTML = `
                <h3>保存失敗</h3>
                <p>httpStatus=<code>${escapeHtml(String(display.httpStatus ?? res.status))}</code></p>
                <p>didWrite=<code>false</code> · dbWrite=<code>false</code> · networkWrite=<code>false</code></p>
                ${
                  errList.length
                    ? `<ul>${errList.map((e) => `<li>${escapeHtml(String(e))}</li>`).join("")}</ul>`
                    : ""
                }
                ${display.unsafeWriteFlags ? `<p role="alert">Unsafe response — treated as FAIL</p>` : ""}
              `;
            }
          }
        } catch (err) {
          const message =
            err instanceof Error
              ? err.name === "AbortError"
                ? "timeout / aborted"
                : err.message
              : String(err);
          if (dryRunResult instanceof HTMLElement) {
            dryRunResult.hidden = false;
            dryRunResult.innerHTML = `<p role="alert">Save network error: ${escapeHtml(message)}</p>`;
          }
        } finally {
          saveInFlight = false;
          void refreshSaveGate();
        }
      })();
      return;
    }
  });

  const onFormEdited = () => {
    if (mode === "view") return;
    setUnsaved(currentDirty());
    if (dryRunFingerprint && dryRunFingerprint !== fingerprint(readForm(root))) {
      invalidateDryRun();
      return;
    }
    void refreshSaveGate();
  };

  root.addEventListener("input", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.matches("[data-gosaki-schedule-search-input]")) {
      applyScheduleSearch((t as HTMLInputElement).value);
      return;
    }
    if (!t.closest("[data-gosaki-schedule-operational-form]")) return;
    onFormEdited();
  });

  root.addEventListener("change", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.matches("[data-gosaki-schedule-search-input]")) {
      applyScheduleSearch((t as HTMLInputElement).value);
      return;
    }
    if (!t.closest("[data-gosaki-schedule-operational-form]")) return;
    onFormEdited();
  });

  root.addEventListener("submit", (ev) => {
    if ((ev.target as HTMLElement | null)?.closest?.("[data-gosaki-schedule-operational-form]")) {
      ev.preventDefault();
    }
  });

  window.addEventListener("beforeunload", (ev) => {
    if (!currentDirty()) return;
    ev.preventDefault();
    ev.returnValue = UNSAVED_LEAVE;
  });

  applyScheduleSearch("");
  showView();
  void refreshSaveGate();
}
