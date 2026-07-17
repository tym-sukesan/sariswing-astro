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

/** Existing-update safe fields (matches G-9j / G-9k). */
export const SCHEDULE_OPERATIONAL_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
] as const;

export type ScheduleOperationalSafeField =
  (typeof SCHEDULE_OPERATIONAL_SAFE_FIELDS)[number];

export type ScheduleOperationalEditDeps = {
  /** Exact "true" only — default false / unset keeps Save disabled. */
  saveArmed?: boolean;
  getAccessToken?: () => Promise<string | null>;
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
    const b = String(before[field] ?? "");
    const a = String(after[field] ?? "");
    if (b !== a) out.push({ field, before: b, after: a });
  }
  return out;
}

/**
 * Local dry-run preview — no fetch / no DB write.
 * Existing edit requires expectedBeforeUpdatedAt when updated_at is present.
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
  errors: string[];
} {
  const errors: string[] = [];
  if (input.mode === "edit" && !input.after.id && !input.after.legacy_id) {
    errors.push("edit target id / legacy_id missing");
  }
  const expectedBeforeUpdatedAt = String(input.after.updated_at ?? "").trim() || null;
  const optimisticLockRequired = input.mode === "edit";
  if (optimisticLockRequired && !expectedBeforeUpdatedAt) {
    errors.push("expectedBeforeUpdatedAt is required for existing-event edit");
  }
  if (!input.authenticated) {
    errors.push("authenticated session required before Save (dry-run preview still available)");
  }

  const diffs =
    input.mode === "create"
      ? SCHEDULE_OPERATIONAL_SAFE_FIELDS.map((field) => ({
          field,
          before: "",
          after: String(input.after[field] ?? ""),
        })).filter((d) => d.after)
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
      errors,
    };
  }

  const guardError = errors.some((e) => e.includes("expectedBeforeUpdatedAt") || e.includes("target"));
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
  const statusEl = root.querySelector("[data-gosaki-schedule-status]");

  let mode: Mode = "view";
  let baseline: FormSnapshot | null = null;
  let dryRunFingerprint: string | null = null;
  let dryRunOk = false;
  let saveInFlight = false;

  const saveArmed = deps.saveArmed === true;

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
    if (dryRunResult instanceof HTMLElement) {
      dryRunResult.hidden = true;
      dryRunResult.innerHTML = "";
    }
    refreshSaveGate();
  }

  function refreshSaveGate() {
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    // G-20u45: Save stays disabled. Arm / auth / dry-run / lock are readiness only.
    void saveArmed;
    void dryRunOk;
    void dryRunFingerprint;
    void saveInFlight;
    void deps.getAccessToken;
    saveBtn.disabled = true;
    saveBtn.setAttribute("data-gosaki-save-allowed", "false");
    saveBtn.title = "Save は無効です（G-20u45 · 通常状態）";
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
    if (statusEl) statusEl.textContent = "公演一覧の確認と編集（閲覧／編集）· Save 無効";
  }

  function showEditor(next: Mode, snap: FormSnapshot, lead: string) {
    mode = next;
    root.dataset.mode = next;
    if (viewMode instanceof HTMLElement) viewMode.hidden = true;
    if (editMode instanceof HTMLElement) editMode.hidden = false;
    if (viewToolbar instanceof HTMLElement) viewToolbar.hidden = true;
    writeForm(root, snap);
    baseline = { ...snap };
    if (lockValue) lockValue.textContent = snap.updated_at || "—";
    if (editLead) editLead.textContent = lead;
    setUnsaved(false);
    invalidateDryRun();
    if (statusEl) {
      statusEl.textContent =
        next === "create"
          ? "新規予定を入力中 · Save 無効"
          : "公演を編集中 · Save 無効";
    }
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

    if (t.closest("[data-gosaki-schedule-create-start]")) {
      if (!confirmLeaveIfDirty()) return;
      showEditor("create", emptyCreateForm(), "新しい予定を追加");
      return;
    }

    if (t.closest("[data-gosaki-edit-start]")) {
      // Toolbar "編集する" without a card — prompt to pick from list
      if (statusEl) {
        statusEl.textContent = "一覧の「編集する」から公演を選んでください";
      }
      return;
    }

    if (t.closest("[data-gosaki-edit-cancel]")) {
      if (!confirmLeaveIfDirty()) return;
      showView();
      return;
    }

    if (t.closest("[data-gosaki-edit-dry-run]")) {
      const after = readForm(root);
      const before = baseline ?? after;
      void (deps.getAccessToken?.() ?? Promise.resolve(null)).then((token) => {
        const result = buildScheduleOperationalLocalDryRun({
          mode: after.mode === "create" ? "create" : "edit",
          before,
          after,
          authenticated: Boolean(token),
        });
        dryRunOk = result.ok && result.saveReadiness !== "guard_error";
        dryRunFingerprint = fingerprint(after);
        if (dryRunResult instanceof HTMLElement) {
          dryRunResult.hidden = false;
          const rows = result.diffs
            .map(
              (d) =>
                `<tr><th>${escapeHtml(d.field)}</th><td>${escapeHtml(d.before || "—")}</td><td>${escapeHtml(d.after || "—")}</td></tr>`,
            )
            .join("");
          dryRunResult.innerHTML = `
            <h3>変更を確認（ローカル dry-run）</h3>
            <p>ok=${result.ok} · wouldWrite=false · saveAllowed=false · readiness=${escapeHtml(result.saveReadiness)}</p>
            <p>expectedBeforeUpdatedAt: <code>${escapeHtml(result.expectedBeforeUpdatedAt || "—")}</code></p>
            <p>changedFields: ${escapeHtml(result.changedFields.join(", ") || "なし")}</p>
            ${
              result.errors.length
                ? `<ul>${result.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
                : ""
            }
            <table><thead><tr><th>field</th><th>before</th><th>after</th></tr></thead><tbody>${rows || "<tr><td colspan=3>差分なし</td></tr>"}</tbody></table>
            <p role="note">この確認ではネットワーク／DB 書き込みは行いません。Save は無効のままです。</p>
          `;
        }
        setUnsaved(currentDirty());
        refreshSaveGate();
      });
      return;
    }

    if (t.closest("[data-gosaki-schedule-save]")) {
      // Fail-closed: never send Save in this phase
      saveInFlight = false;
      refreshSaveGate();
    }
  });

  root.addEventListener("input", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.closest("[data-gosaki-schedule-operational-form]")) return;
    setUnsaved(currentDirty());
    if (dryRunFingerprint && dryRunFingerprint !== fingerprint(readForm(root))) {
      invalidateDryRun();
    }
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

  showView();
  refreshSaveGate();
}
