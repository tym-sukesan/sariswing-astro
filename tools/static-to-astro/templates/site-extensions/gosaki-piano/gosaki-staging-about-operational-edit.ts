/**
 * Gosaki About operational edit — dry-run click-only · gated Save (default disarmed).
 * Reuses gosaki-about-content-dry-run / gosaki-about-content-save (G-12a).
 * Runtime lock: GitHub Contents fingerprint (file SHA + before/after snapshot).
 */

export type AboutFormSnapshot = {
  profile: { heading: string; body: string; imageAlt: string };
  bands: Array<{ id: string; name: string; body: string; imageAlt: string }>;
};

export type AboutOperationalEditDeps = {
  saveArmed?: boolean;
  getAccessToken?: () => Promise<string | null>;
  dryRunEndpoint?: string;
  saveEndpoint?: string;
  anonKey?: string;
  assertDryRunEndpointSafe?: (endpoint: string) => boolean;
  assertSaveEndpointSafe?: (endpoint: string) => boolean;
  buildDryRunEndpointRequest?: (next: AboutFormSnapshot) => Record<string, unknown>;
  buildSaveEndpointRequest?: (input: {
    next: AboutFormSnapshot;
    expectedBefore: AboutFormSnapshot;
    fingerprint: string;
    requestId?: string;
  }) => Record<string, unknown>;
  sanitizeDryRunDisplay?: (
    body: unknown,
    httpStatus?: number,
  ) => {
    ok?: boolean;
    dryRun?: boolean;
    fingerprint?: string;
    currentFileSha?: string;
    current?: AboutFormSnapshot;
    next?: AboutFormSnapshot;
    before?: AboutFormSnapshot;
    after?: AboutFormSnapshot;
    errors: string[];
    noChange?: boolean;
    authIssue?: boolean;
    unsafeWriteFlags?: boolean;
    fetchError?: string;
    saveReadiness?: string;
    changedFields?: string[];
    indeterminate?: boolean;
  };
  sanitizeSaveDisplay?: AboutOperationalEditDeps["sanitizeDryRunDisplay"] &
    ((
      body: unknown,
      httpStatus?: number,
    ) => {
      commitSha?: string;
      commitUrl?: string | null;
      newFileSha?: string;
      indeterminate?: boolean;
      didWrite?: boolean;
    });
  evaluateSaveGate?: (input: {
    authenticated: boolean;
    dryRunSucceeded: boolean;
    formMatchesDryRunSnapshot: boolean;
    fingerprintPresent: boolean;
    expectedBeforePresent: boolean;
    saveEndpointConfigured: boolean;
    saveEndpointSafe: boolean;
    envArmed: boolean;
    approvalId: string;
    expectedApprovalId: string;
    saveInFlight: boolean;
    noChange?: boolean;
  }) => { enabled: boolean; reason: string };
  isSaveConflictResponse?: (body: unknown) => boolean;
  expectedSaveApprovalId?: string;
  conflictMessage?: string;
  productionProjectRefStop?: string;
  fetchImpl?: typeof fetch;
};

const SAVE_LABEL_ENABLED = "保存";
const SAVE_LABEL_DISABLED = "保存";
const SAVE_UNARMED_MSG =
  "保存の準備ができました。現在のテスト環境では保存は無効です。";
let pendingOneClickSave = false;

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function initGosakiAboutOperationalEdit(
  root: HTMLElement,
  deps: AboutOperationalEditDeps = {},
): void {
  const dryRunBtn = root.querySelector(
    "#gosaki-about-dry-run-btn, [data-gosaki-about-dry-run]",
  );
  const cancelBtn = root.querySelector("[data-gosaki-about-cancel]");
  const saveBtn = root.querySelector("#gosaki-about-save-btn, [data-gosaki-about-save]");
  const saveReasonEl = root.querySelector(
    "#gosaki-about-save-disabled-reason, [data-gosaki-about-save-reason]",
  );
  const resultEl = root.querySelector(
    "#gosaki-about-dry-run-result, [data-gosaki-about-dry-run-result]",
  );
  const statusEl = root.querySelector("[data-gosaki-about-status]");
  const localValidationEl = root.querySelector("[data-gosaki-about-local-validation]");

  let dryRunOk = false;
  let dryRunNoChange = false;
  let dryRunFormFingerprint: string | null = null;
  let dryRunServerFingerprint: string | null = null;
  let dryRunFileSha: string | null = null;
  let dryRunExpectedBefore: AboutFormSnapshot | null = null;
  let saveInFlight = false;
  let dryRunInFlight = false;
  let authenticated = false;
  /** Cancel/dirty baseline — updated to Save response.after on successful Save. */
  let baselineFingerprint: string | null = null;

  const saveArmed = deps.saveArmed === true;
  const expectedSaveApprovalId = String(deps.expectedSaveApprovalId ?? "").trim();
  const conflictMessage =
    deps.conflictMessage ??
    "GitHub 上の current が変わりました。再度「変更を確認」（dry-run）してください。";
  const productionStop = deps.productionProjectRefStop ?? "vsbvndwuajjhnzpohghh";
  const fetchImpl = deps.fetchImpl ?? fetch;

  function readFormSnapshot(): AboutFormSnapshot {
    const heading =
      (
        root.querySelector(
          '[data-gosaki-about-field="profile-heading"]',
        ) as HTMLInputElement | null
      )?.value ?? "";
    const body =
      (
        root.querySelector(
          '[data-gosaki-about-field="profile-body"]',
        ) as HTMLTextAreaElement | null
      )?.value ?? "";
    const imageAlt =
      (
        root.querySelector(
          '[data-gosaki-about-field="profile-image-alt"]',
        ) as HTMLInputElement | null
      )?.value ?? "";

    const bands: AboutFormSnapshot["bands"] = [];
    root.querySelectorAll("[data-gosaki-about-band]").forEach((el) => {
      const id = String((el as HTMLElement).dataset.gosakiAboutBand || "").trim();
      if (!id) return;
      const name =
        (
          el.querySelector('[data-gosaki-about-field="band-name"]') as HTMLInputElement | null
        )?.value ?? "";
      const bandBody =
        (
          el.querySelector('[data-gosaki-about-field="band-body"]') as HTMLTextAreaElement | null
        )?.value ?? "";
      const bandAlt =
        (
          el.querySelector(
            '[data-gosaki-about-field="band-image-alt"]',
          ) as HTMLInputElement | null
        )?.value ?? "";
      bands.push({
        id,
        name: String(name).trim(),
        body: String(bandBody).replace(/\r\n/g, "\n").trim(),
        imageAlt: String(bandAlt).trim(),
      });
    });

    return {
      profile: {
        heading: String(heading).trim(),
        body: String(body).replace(/\r\n/g, "\n").trim(),
        imageAlt: String(imageAlt).trim(),
      },
      bands,
    };
  }

  function formFingerprint(snapshot: AboutFormSnapshot): string {
    return JSON.stringify(snapshot);
  }

  function isFormDirty(): boolean {
    if (baselineFingerprint == null) return false;
    return formFingerprint(readFormSnapshot()) !== baselineFingerprint;
  }

  function writeFormSnapshot(snapshot: AboutFormSnapshot): void {
    const heading = root.querySelector(
      '[data-gosaki-about-field="profile-heading"]',
    ) as HTMLInputElement | null;
    const body = root.querySelector(
      '[data-gosaki-about-field="profile-body"]',
    ) as HTMLTextAreaElement | null;
    const imageAlt = root.querySelector(
      '[data-gosaki-about-field="profile-image-alt"]',
    ) as HTMLInputElement | null;
    if (heading) heading.value = snapshot.profile.heading;
    if (body) body.value = snapshot.profile.body;
    if (imageAlt) imageAlt.value = snapshot.profile.imageAlt;

    root.querySelectorAll("[data-gosaki-about-band]").forEach((el) => {
      const id = String((el as HTMLElement).dataset.gosakiAboutBand || "").trim();
      const band = snapshot.bands.find((b) => b.id === id);
      if (!band) return;
      const name = el.querySelector(
        '[data-gosaki-about-field="band-name"]',
      ) as HTMLInputElement | null;
      const bandBody = el.querySelector(
        '[data-gosaki-about-field="band-body"]',
      ) as HTMLTextAreaElement | null;
      const bandAlt = el.querySelector(
        '[data-gosaki-about-field="band-image-alt"]',
      ) as HTMLInputElement | null;
      if (name) name.value = band.name;
      if (bandBody) bandBody.value = band.body;
      if (bandAlt) bandAlt.value = band.imageAlt;
    });
  }

  function invalidateDryRun() {
    dryRunOk = false;
    dryRunNoChange = false;
    dryRunFormFingerprint = null;
    dryRunServerFingerprint = null;
    dryRunFileSha = null;
    dryRunExpectedBefore = null;
    void refreshSaveGate();
  }

  function applyDryRunButtonUi() {
    if (!(dryRunBtn instanceof HTMLButtonElement)) return;
    // Client arm must NOT gate dry-run — only Save. Enable when dirty and not in-flight.
    // Auth / CompactAuthBar must never disable this button; auth is checked on click only.
    const dirty = isFormDirty();
    const enabled = dirty && !dryRunInFlight && !saveInFlight;
    dryRunBtn.disabled = !enabled;
    dryRunBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    dryRunBtn.title = enabled
      ? "変更内容を dry-run で確認（GitHub GET · write なし）"
      : dryRunInFlight
        ? "dry-run 実行中…"
        : "編集後に有効になります";
  }

  function setLocalValidation(message: string, ok: boolean | null) {
    if (!(localValidationEl instanceof HTMLElement)) return;
    localValidationEl.textContent = message;
    localValidationEl.classList.toggle("gosaki-read-only-admin__meta--ok", ok === true);
    localValidationEl.classList.toggle("gosaki-read-only-admin__meta--warn", ok === false);
  }

  function showResultHtml(html: string) {
    if (!(resultEl instanceof HTMLElement)) return;
    resultEl.hidden = false;
    resultEl.innerHTML = html;
  }

  function showResultJson(obj: unknown) {
    if (!(resultEl instanceof HTMLElement)) return;
    resultEl.hidden = false;
    resultEl.textContent = JSON.stringify(obj, null, 2);
  }

  function applySaveButtonUi(enabled: boolean, reason: string) {
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    saveBtn.disabled = true;
    if (enabled) saveBtn.disabled = false;
    saveBtn.setAttribute("data-gosaki-save-allowed", enabled ? "true" : "false");
    saveBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    saveBtn.textContent = enabled ? SAVE_LABEL_ENABLED : SAVE_LABEL_DISABLED;
    saveBtn.title = reason || "保存";
    if (saveReasonEl instanceof HTMLElement) {
      saveReasonEl.textContent = reason || (enabled ? "保存" : "変更があると保存できます");
      saveReasonEl.classList.toggle("gosaki-read-only-admin__meta--ok", enabled);
      saveReasonEl.classList.toggle("gosaki-read-only-admin__meta--warn", false);
    }
    if (statusEl instanceof HTMLElement) {
      statusEl.textContent = reason || "プロフィールを編集中";
    }
  }

  async function refreshAuthFlag(): Promise<boolean> {
    if (!deps.getAccessToken) {
      authenticated = false;
      return false;
    }
    const token = await deps.getAccessToken();
    authenticated = Boolean(token);
    return authenticated;
  }

  async function refreshSaveGate() {
    applyDryRunButtonUi();
    const auth = await refreshAuthFlag();
    applyDryRunButtonUi();
    if (saveInFlight || dryRunInFlight) {
      applySaveButtonUi(false, saveInFlight ? "保存中…" : "確認中…");
      return;
    }
    if (!isFormDirty()) {
      applySaveButtonUi(false, "変更がありません");
      return;
    }
    if (!auth) {
      applySaveButtonUi(false, "ログインが必要です");
      return;
    }
    applySaveButtonUi(true, "保存");
  }

  function wireFormInvalidate() {
    root.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", () => {
        invalidateDryRun();
        applyDryRunButtonUi();
      });
      el.addEventListener("change", () => {
        invalidateDryRun();
        applyDryRunButtonUi();
      });
    });
  }

  async function runDryRun() {
    if (dryRunInFlight || saveInFlight) return;
    const auth = await refreshAuthFlag();
    if (!auth) {
      setLocalValidation("ログインが必要です", false);
      showResultHtml(`<p class="gosaki-read-only-admin__meta--warn">ログインが必要です</p>`);
      return;
    }
    const endpoint = String(deps.dryRunEndpoint ?? "").trim();
    if (!endpoint || !deps.assertDryRunEndpointSafe?.(endpoint) || endpoint.includes(productionStop)) {
      setLocalValidation("dry-run endpoint が未設定またはブロックされています", false);
      return;
    }
    const next = readFormSnapshot();
    if (!next.profile.heading || !next.profile.body || next.bands.length === 0) {
      setLocalValidation("見出し・本文・バンドを入力してください", false);
      return;
    }
    if (!deps.buildDryRunEndpointRequest) {
      setLocalValidation("dry-run request builder 未配線", false);
      return;
    }

    dryRunInFlight = true;
    void refreshSaveGate();
    setLocalValidation("dry-run 実行中…", null);

    try {
      const token = await deps.getAccessToken?.();
      if (!token) {
        setLocalValidation("アクセストークンがありません", false);
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
      const anon = String(deps.anonKey ?? "").trim();
      if (anon) headers.apikey = anon;

      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(deps.buildDryRunEndpointRequest(next)),
      });
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = { error: "Invalid JSON response" };
      }
      const display =
        deps.sanitizeDryRunDisplay?.(body, response.status) ??
        ({
          ok: false,
          errors: ["sanitize missing"],
          noChange: false,
        } as const);

      if (display.unsafeWriteFlags) {
        invalidateDryRun();
        setLocalValidation("unsafe dry-run response", false);
        showResultJson(display);
        return;
      }
      if (display.noChange) {
        dryRunOk = false;
        dryRunNoChange = true;
        dryRunFormFingerprint = formFingerprint(next);
        dryRunServerFingerprint = display.fingerprint ?? null;
        dryRunFileSha = display.currentFileSha ?? null;
        dryRunExpectedBefore = display.current ?? display.before ?? null;
        setLocalValidation("変更なし（no_change）", null);
        showResultHtml(
          `<p>no_change · changedFields: none</p><pre>${escapeHtml(
            JSON.stringify(display, null, 2),
          )}</pre>`,
        );
        void refreshSaveGate();
        return;
      }
      if (!display.ok || !display.fingerprint || !display.currentFileSha) {
        invalidateDryRun();
        setLocalValidation(display.errors?.[0] || "dry-run 失敗", false);
        showResultJson(display);
        return;
      }

      dryRunOk = true;
      dryRunNoChange = false;
      dryRunFormFingerprint = formFingerprint(next);
      dryRunServerFingerprint = display.fingerprint;
      dryRunFileSha = display.currentFileSha;
      dryRunExpectedBefore = display.current ?? display.before ?? null;
      setLocalValidation(
        `dry-run OK · ${(display.changedFields || []).join(", ") || "changed"}`,
        true,
      );
      showResultHtml(
        `<p class="gosaki-read-only-admin__meta--ok">dry-run 成功（GitHub GET only · write なし）</p><pre>${escapeHtml(
          JSON.stringify(display, null, 2),
        )}</pre>`,
      );
      void refreshSaveGate();
    } catch (err) {
      invalidateDryRun();
      setLocalValidation("dry-run 通信エラー", false);
      showResultJson({
        ok: false,
        fetchError: err instanceof Error ? err.message : String(err),
        errors: ["fetch failed"],
      });
    } finally {
      dryRunInFlight = false;
      void refreshSaveGate();
      if (pendingOneClickSave) {
        const next = readFormSnapshot();
        const matched =
          dryRunOk &&
          dryRunFormFingerprint != null &&
          formFingerprint(next) === dryRunFormFingerprint;
        if (!matched) {
          pendingOneClickSave = false;
          applySaveButtonUi(true, "入力内容を確認してください");
          return;
        }
        if (!saveArmed) {
          pendingOneClickSave = false;
          applySaveButtonUi(false, SAVE_UNARMED_MSG);
          return;
        }
        pendingOneClickSave = false;
        void runSave();
      }
    }
  }

  async function runSave() {
    if (saveInFlight || dryRunInFlight) return;
    const auth = await refreshAuthFlag();
    if (!auth) {
      applySaveButtonUi(false, "ログインが必要です");
      return;
    }
    if (!isFormDirty()) {
      applySaveButtonUi(false, "変更がありません");
      return;
    }
    const next = readFormSnapshot();
    const formMatches =
      dryRunOk &&
      dryRunFormFingerprint != null &&
      formFingerprint(next) === dryRunFormFingerprint &&
      dryRunServerFingerprint != null &&
      dryRunFileSha != null &&
      dryRunExpectedBefore != null;

    if (!formMatches) {
      pendingOneClickSave = true;
      applySaveButtonUi(false, "確認中…");
      await runDryRun();
      return;
    }

    if (!saveArmed) {
      applySaveButtonUi(false, SAVE_UNARMED_MSG);
      return;
    }

    const saveEndpoint = String(deps.saveEndpoint ?? "").trim();
    const saveSafe =
      Boolean(deps.assertSaveEndpointSafe?.(saveEndpoint)) &&
      !saveEndpoint.includes(productionStop);
    const gate =
      deps.evaluateSaveGate?.({
        authenticated: auth,
        dryRunSucceeded: dryRunOk,
        formMatchesDryRunSnapshot: Boolean(formMatches),
        fingerprintPresent: Boolean(dryRunServerFingerprint && dryRunFileSha),
        expectedBeforePresent: Boolean(dryRunExpectedBefore),
        saveEndpointConfigured: Boolean(saveEndpoint),
        saveEndpointSafe: saveSafe,
        envArmed: saveArmed,
        approvalId: expectedSaveApprovalId,
        expectedApprovalId: expectedSaveApprovalId,
        saveInFlight: false,
        noChange: dryRunNoChange,
      }) ?? { enabled: false, reason: "いまは保存できません" };

    if (!gate.enabled) {
      applySaveButtonUi(false, gate.reason);
      return;
    }
    if (!deps.buildSaveEndpointRequest || !dryRunExpectedBefore || !dryRunServerFingerprint) {
      applySaveButtonUi(false, "いまは保存できません");
      return;
    }

    saveInFlight = true;
    applySaveButtonUi(false, "保存処理中です…");
    setLocalValidation("Save 実行中…（再試行禁止）", null);

    try {
      const token = await deps.getAccessToken?.();
      if (!token) {
        invalidateDryRun();
        setLocalValidation("アクセストークンがありません", false);
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
      const anon = String(deps.anonKey ?? "").trim();
      if (anon) headers.apikey = anon;

      let response: Response;
      try {
        response = await fetchImpl(saveEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(
            deps.buildSaveEndpointRequest({
              next,
              expectedBefore: dryRunExpectedBefore,
              fingerprint: dryRunServerFingerprint,
            }),
          ),
        });
      } catch (err) {
        invalidateDryRun();
        setLocalValidation("Save 通信結果不明 — 再試行禁止 · verification_required", false);
        showResultHtml(
          `<p class="gosaki-read-only-admin__meta--warn">通信結果不明 · 再試行禁止 · verification_required</p><pre>${escapeHtml(
            err instanceof Error ? err.message : String(err),
          )}</pre>`,
        );
        return;
      }

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        invalidateDryRun();
        setLocalValidation("Save 応答不明 — 再試行禁止 · verification_required", false);
        showResultHtml(
          `<p class="gosaki-read-only-admin__meta--warn">応答不明 · 再試行禁止 · verification_required</p>`,
        );
        return;
      }

      const display =
        deps.sanitizeSaveDisplay?.(body, response.status) ??
        ({
          ok: false,
          errors: ["sanitize missing"],
        } as const);

      if (display.indeterminate) {
        invalidateDryRun();
        setLocalValidation("verification_required — 再試行禁止", false);
        showResultJson(display);
        return;
      }
      if (deps.isSaveConflictResponse?.(body) || response.status === 409) {
        invalidateDryRun();
        setLocalValidation(conflictMessage, false);
        showResultHtml(
          `<p class="gosaki-read-only-admin__meta--warn">${escapeHtml(conflictMessage)}</p><pre>${escapeHtml(
            JSON.stringify(display, null, 2),
          )}</pre>`,
        );
        return;
      }
      if (!display.ok) {
        invalidateDryRun();
        setLocalValidation(display.errors?.[0] || "Save 失敗", false);
        showResultJson(display);
        return;
      }

      // Save success: response.after becomes the new dirty/cancel baseline.
      // Form keeps saved values; dirty=false until the operator edits again.
      const savedAfter = display.after ?? display.next ?? next;
      writeFormSnapshot(savedAfter);
      baselineFingerprint = formFingerprint(savedAfter);

      invalidateDryRun();
      applyDryRunButtonUi();
      setLocalValidation(
        `Save 成功 · commit ${String((display as { commitSha?: string }).commitSha ?? "").slice(0, 8)}`,
        true,
      );
      showResultHtml(
        `<p class="gosaki-read-only-admin__meta--ok">Save 成功（GitHub Contents · workflow_dispatch なし）</p><pre>${escapeHtml(
          JSON.stringify(display, null, 2),
        )}</pre>`,
      );
      if (statusEl instanceof HTMLElement) {
        statusEl.textContent = "About Save 完了 · Save 再無効化済み";
      }
    } finally {
      saveInFlight = false;
      void refreshSaveGate();
    }
  }

  if (dryRunBtn instanceof HTMLButtonElement) {
    dryRunBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      void runDryRun();
    });
  }
  if (cancelBtn instanceof HTMLButtonElement) {
    cancelBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (baselineFingerprint) {
        try {
          writeFormSnapshot(JSON.parse(baselineFingerprint) as AboutFormSnapshot);
        } catch {
          // keep current fields if baseline parse fails
        }
      }
      invalidateDryRun();
      if (resultEl instanceof HTMLElement) {
        resultEl.hidden = true;
        resultEl.textContent = "";
      }
      setLocalValidation("キャンセルしました — 編集前に戻しました", null);
      applyDryRunButtonUi();
    });
  }
  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      void runSave();
    });
  }

  wireFormInvalidate();
  baselineFingerprint = formFingerprint(readFormSnapshot());
  applySaveButtonUi(false, saveArmed ? "先に dry-run を実行してください" : "通常 package · client arm=false");
  applyDryRunButtonUi();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshSaveGate();
  });
  window.addEventListener("focus", () => {
    void refreshSaveGate();
  });
  window.addEventListener("gosaki-admin-auth-changed", () => {
    void refreshSaveGate();
  });
  void refreshSaveGate();
}
