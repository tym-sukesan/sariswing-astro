/**
 * Gosaki YouTube operational edit — dry-run click-only · gated Save (default disarmed).
 * Reuses gosaki-youtube-url-dry-run / gosaki-youtube-url-save contracts (G-11c1 / G-11c6).
 * Runtime lock: GitHub Contents fingerprint (file SHA + before/after), not build-time snapshot.
 */

export type YoutubeOperationalEditDeps = {
  /** Exact true only — normal STG package keeps Save disabled. */
  saveArmed?: boolean;
  getAccessToken?: () => Promise<string | null>;
  dryRunEndpoint?: string;
  saveEndpoint?: string;
  anonKey?: string;
  assertDryRunEndpointSafe?: (endpoint: string) => boolean;
  assertSaveEndpointSafe?: (endpoint: string) => boolean;
  buildDryRunEndpointRequest?: (nextValue: string) => Record<string, unknown>;
  buildSaveEndpointRequest?: (input: {
    nextValue: string;
    expectedBefore: { embedCode: string; videoId?: string | null };
    fingerprint: string;
    requestId?: string;
  }) => Record<string, unknown>;
  sanitizeDryRunDisplay?: (
    body: unknown,
    httpStatus?: number,
  ) => {
    httpStatus?: number;
    ok?: boolean;
    dryRun?: boolean;
    wouldWrite?: boolean;
    changedFields?: string[];
    current?: { embedCode?: string; videoId?: string | null };
    next?: { embedCode?: string; videoId?: string | null };
    before?: { embedCode?: string; videoId?: string | null };
    after?: { embedCode?: string; videoId?: string | null };
    fingerprint?: string;
    currentFileSha?: string;
    newFileSha?: string;
    error?: string;
    errors: string[];
    didWrite: boolean;
    dbWrite: boolean;
    networkWrite: boolean;
    saveEnabled: boolean;
    authIssue?: boolean;
    unsafeWriteFlags?: boolean;
    fetchError?: string;
    noChange?: boolean;
    saveReadiness?: string;
    indeterminate?: boolean;
  };
  sanitizeSaveDisplay?: YoutubeOperationalEditDeps["sanitizeDryRunDisplay"] &
    ((
      body: unknown,
      httpStatus?: number,
    ) => {
      commitSha?: string;
      commitUrl?: string | null;
      newFileSha?: string;
      indeterminate?: boolean;
    });
  evaluateSaveGate?: (input: {
    authenticated: boolean;
    dryRunSucceeded: boolean;
    formMatchesDryRunSnapshot: boolean;
    fingerprintPresent: boolean;
    expectedBeforeEmbed: string | null;
    expectedBeforeVideoId: string | null;
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
  parseVideoId?: (input: string | null | undefined) => string | null;
};

const SAVE_LABEL_ENABLED = "更新する";
const SAVE_LABEL_DISABLED = "更新する（無効）";

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function initGosakiYoutubeOperationalEdit(
  root: HTMLElement,
  deps: YoutubeOperationalEditDeps = {},
): void {
  const form = root.querySelector("[data-gosaki-youtube-operational-form]");
  const nextInput = root.querySelector(
    "#gra-youtube-next-url, [data-gosaki-youtube-next-url]",
  );
  const dryRunBtn = root.querySelector(
    "#gra-youtube-dry-run-btn, [data-gosaki-youtube-dry-run]",
  );
  const cancelBtn = root.querySelector("[data-gosaki-youtube-cancel]");
  const saveBtn = root.querySelector("#gra-youtube-save-btn, [data-gosaki-youtube-save]");
  const saveReasonEl = root.querySelector(
    "#gra-youtube-save-disabled-reason, [data-gosaki-youtube-save-reason]",
  );
  const resultEl = root.querySelector(
    "#gra-youtube-dry-run-result, [data-gosaki-youtube-dry-run-result]",
  );
  const currentDisplay = root.querySelector("[data-gosaki-youtube-current-display]");
  const currentVideoIdEl = root.querySelector(
    "#gra-youtube-videoid, [data-gosaki-youtube-current-videoid]",
  );
  const statusEl = root.querySelector("[data-gosaki-youtube-status]");
  const localValidationEl = root.querySelector("[data-gosaki-youtube-local-validation]");

  const body = document.body;
  const baselineEmbed = String(
    body?.dataset.gosakiYoutubeCurrentEmbed ||
      (currentDisplay instanceof HTMLElement ? currentDisplay.textContent : "") ||
      "",
  ).trim();
  const baselineVideoId = String(
    body?.dataset.gosakiYoutubeCurrentVideoid ||
      (currentVideoIdEl instanceof HTMLInputElement ? currentVideoIdEl.value : "") ||
      "",
  ).trim();

  let liveCurrentEmbed = baselineEmbed;
  let liveCurrentVideoId = baselineVideoId;

  let dryRunOk = false;
  let dryRunNoChange = false;
  /** Form value fingerprint (next URL) — must match for Save. */
  let dryRunFormFingerprint: string | null = null;
  /** Server GitHub lock fingerprint from dry-run — must be sent on Save. */
  let dryRunServerFingerprint: string | null = null;
  let dryRunFileSha: string | null = null;
  let dryRunExpectedEmbed: string | null = null;
  let dryRunExpectedVideoId: string | null = null;
  let saveInFlight = false;
  let dryRunInFlight = false;
  let authenticated = false;

  const saveArmed = deps.saveArmed === true;
  const expectedSaveApprovalId = String(deps.expectedSaveApprovalId ?? "").trim();
  const conflictMessage =
    deps.conflictMessage ??
    "GitHub 上の current が変わりました。再度「変更を確認」（dry-run）で GitHub current を取得してください。";
  const productionStop = deps.productionProjectRefStop ?? "vsbvndwuajjhnzpohghh";
  const fetchImpl = deps.fetchImpl ?? fetch;
  const parseVideoId =
    deps.parseVideoId ??
    ((input: string | null | undefined) => {
      const raw = String(input ?? "").trim();
      if (!raw) return null;
      if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
      try {
        const url = new URL(raw);
        const host = url.hostname.replace(/^www\./, "");
        if (host === "youtu.be") {
          const id = url.pathname.replace(/^\//, "").split("/")[0];
          return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
        }
        if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
          if (url.pathname.startsWith("/embed/")) {
            const id = url.pathname.split("/")[2];
            return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
          }
          const v = url.searchParams.get("v");
          return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
        }
      } catch {
        return null;
      }
      return null;
    });

  function readNextValue(): string {
    if (!(nextInput instanceof HTMLInputElement || nextInput instanceof HTMLTextAreaElement)) {
      return "";
    }
    return String(nextInput.value || "").trim();
  }

  function formFingerprint(value: string): string {
    return value;
  }

  function invalidateDryRun() {
    dryRunOk = false;
    dryRunNoChange = false;
    dryRunFormFingerprint = null;
    dryRunServerFingerprint = null;
    dryRunFileSha = null;
    dryRunExpectedEmbed = null;
    dryRunExpectedVideoId = null;
    void refreshSaveGate();
  }

  function applyLiveCurrent(embed: string, videoId: string | null | undefined) {
    const nextEmbed = String(embed ?? "").trim();
    const nextVid = String(videoId ?? parseVideoId(nextEmbed) ?? "").trim();
    liveCurrentEmbed = nextEmbed;
    liveCurrentVideoId = nextVid;
    if (currentDisplay instanceof HTMLElement) currentDisplay.textContent = nextEmbed;
    if (currentVideoIdEl instanceof HTMLInputElement) {
      currentVideoIdEl.value = nextVid || "—";
    }
    if (body?.dataset) {
      body.dataset.gosakiYoutubeCurrentEmbed = nextEmbed;
      body.dataset.gosakiYoutubeCurrentVideoid = nextVid;
    }
  }

  function setLocalValidation(message: string, ok: boolean | null) {
    if (!(localValidationEl instanceof HTMLElement)) return;
    localValidationEl.textContent = message;
    localValidationEl.classList.toggle("gosaki-read-only-admin__meta--ok", ok === true);
    localValidationEl.classList.toggle("gosaki-read-only-admin__meta--warn", ok === false);
  }

  function updateLocalValidationFromInput() {
    const value = readNextValue();
    if (!value) {
      setLocalValidation("URL を入力してください", null);
      return;
    }
    const id = parseVideoId(value);
    if (!id) {
      setLocalValidation(
        "この形式は未対応です（許容: watch?v= / youtu.be / embed / 11文字 videoId）",
        false,
      );
      return;
    }
    setLocalValidation(`形式OK · videoId: ${id}`, true);
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
    saveBtn.title = enabled
      ? "保存できます（operator 明示操作のみ）"
      : reason || "Save は無効です（通常 STG package）";
    if (saveReasonEl instanceof HTMLElement) {
      saveReasonEl.textContent = enabled
        ? "保存できます（operator 明示操作のみ）"
        : reason || "Save は無効です";
      saveReasonEl.classList.toggle("gosaki-read-only-admin__meta--ok", enabled);
      saveReasonEl.classList.toggle("gosaki-read-only-admin__meta--warn", !enabled);
    }
    if (statusEl instanceof HTMLElement) {
      statusEl.textContent = enabled
        ? "YouTube URL 編集中 · Save 可能"
        : "YouTube URL 編集中 · Save 無効";
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
    const auth = await refreshAuthFlag();
    if (dryRunBtn instanceof HTMLButtonElement) {
      dryRunBtn.disabled = dryRunInFlight || !auth;
    }
    const nextValue = readNextValue();
    const formMatches =
      dryRunOk &&
      dryRunFormFingerprint != null &&
      formFingerprint(nextValue) === dryRunFormFingerprint &&
      dryRunServerFingerprint != null &&
      dryRunFileSha != null;
    const saveEndpoint = String(deps.saveEndpoint ?? "").trim();
    const saveSafe =
      Boolean(deps.assertSaveEndpointSafe?.(saveEndpoint)) &&
      !saveEndpoint.includes(productionStop);
    const gate =
      deps.evaluateSaveGate?.({
        authenticated: auth,
        dryRunSucceeded: dryRunOk,
        formMatchesDryRunSnapshot: formMatches,
        fingerprintPresent: Boolean(dryRunServerFingerprint && dryRunFileSha),
        expectedBeforeEmbed: dryRunExpectedEmbed,
        expectedBeforeVideoId: dryRunExpectedVideoId,
        saveEndpointConfigured: Boolean(saveEndpoint),
        saveEndpointSafe: saveSafe,
        envArmed: saveArmed,
        approvalId: expectedSaveApprovalId,
        expectedApprovalId: expectedSaveApprovalId,
        saveInFlight,
        noChange: dryRunNoChange,
      }) ?? {
        enabled: false,
        reason: "Save gate 未配線",
      };
    applySaveButtonUi(gate.enabled, gate.reason);
  }

  function renderDryRunSuccess(
    display: NonNullable<
      ReturnType<NonNullable<YoutubeOperationalEditDeps["sanitizeDryRunDisplay"]>>
    >,
  ) {
    const beforeEmbed = escapeHtml(
      String(display.before?.embedCode ?? display.current?.embedCode ?? liveCurrentEmbed),
    );
    const afterEmbed = escapeHtml(
      String(display.after?.embedCode ?? display.next?.embedCode ?? readNextValue()),
    );
    const beforeVid = escapeHtml(
      String(display.before?.videoId ?? display.current?.videoId ?? liveCurrentVideoId ?? "—"),
    );
    const afterVid = escapeHtml(
      String(display.after?.videoId ?? display.next?.videoId ?? "—"),
    );
    const fields = (display.changedFields ?? []).map(escapeHtml).join(", ") || "（なし）";
    const sha = escapeHtml(String(display.currentFileSha ?? dryRunFileSha ?? "—"));
    showResultHtml(
      `<div class="gosaki-youtube-dry-run-card">` +
        `<p><strong>dry-run OK</strong> · didWrite=false · dbWrite=false · networkWrite=false</p>` +
        `<p>changedFields: ${fields}</p>` +
        `<p>currentFileSha: <code>${sha}</code></p>` +
        `<p><strong>現在値（GitHub）</strong><br><code class="gosaki-youtube-url-break">${beforeEmbed}</code><br>videoId: ${beforeVid}</p>` +
        `<p><strong>変更後</strong><br><code class="gosaki-youtube-url-break">${afterEmbed}</code><br>videoId: ${afterVid}</p>` +
        `<p>Save: ${saveArmed ? "controlled arm 時のみ有効化候補" : "通常 package では無効のまま"}</p>` +
        `</div>`,
    );
  }

  async function runDryRun() {
    if (dryRunInFlight || saveInFlight) return;
    const auth = await refreshAuthFlag();
    if (!auth) {
      showResultJson({
        ok: false,
        error: "auth_required",
        message: "未ログイン — staging 管理者でログインしてから dry-run してください",
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
      });
      invalidateDryRun();
      return;
    }

    const endpoint = String(deps.dryRunEndpoint ?? "").trim();
    if (!endpoint || !deps.assertDryRunEndpointSafe?.(endpoint) || endpoint.includes(productionStop)) {
      showResultJson({
        ok: false,
        error: "dry-run endpoint not configured or blocked",
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
      });
      invalidateDryRun();
      return;
    }

    const nextValue = readNextValue();
    if (!nextValue) {
      showResultJson({ ok: false, error: "next YouTube URL is required", didWrite: false });
      invalidateDryRun();
      return;
    }

    const localId = parseVideoId(nextValue);
    if (!localId) {
      setLocalValidation(
        "この形式は未対応です（許容: watch?v= / youtu.be / embed / 11文字 videoId）",
        false,
      );
      showResultJson({
        ok: false,
        error: "invalid_youtube_url",
        message: "URL validation failed (client)",
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
      });
      invalidateDryRun();
      return;
    }

    if (!deps.buildDryRunEndpointRequest || !deps.sanitizeDryRunDisplay) {
      showResultJson({ ok: false, error: "dry-run wiring incomplete" });
      return;
    }

    const token = await deps.getAccessToken?.();
    if (!token) {
      showResultJson({ ok: false, error: "auth_required", httpStatus: 401 });
      invalidateDryRun();
      return;
    }

    dryRunInFlight = true;
    void refreshSaveGate();
    if (resultEl instanceof HTMLElement) {
      resultEl.hidden = false;
      resultEl.textContent = "Dry-run リクエスト送信中…（GitHub GET のみ · 保存されません）";
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const anon = String(deps.anonKey ?? "").trim();
      if (anon) headers.apikey = anon;

      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(deps.buildDryRunEndpointRequest(nextValue)),
      });
      let bodyData: unknown = null;
      try {
        bodyData = await res.json();
      } catch {
        bodyData = { error: "non-JSON response" };
      }
      const display = deps.sanitizeDryRunDisplay(bodyData, res.status);

      if (display.noChange) {
        dryRunOk = false;
        dryRunNoChange = true;
        dryRunFormFingerprint = null;
        dryRunServerFingerprint = null;
        dryRunFileSha = null;
        dryRunExpectedEmbed = null;
        dryRunExpectedVideoId = null;
        showResultJson({
          ...display,
          ok: false,
          message: "no_change — Save は有効化されません。別の URL を入力して再度 dry-run してください",
          didWrite: false,
          dbWrite: false,
          networkWrite: false,
        });
      } else if (
        display.ok &&
        display.dryRun === true &&
        display.wouldWrite !== true &&
        !display.unsafeWriteFlags &&
        display.errors.length === 0 &&
        typeof display.fingerprint === "string" &&
        display.fingerprint.trim() !== "" &&
        typeof display.currentFileSha === "string" &&
        display.currentFileSha.trim() !== ""
      ) {
        dryRunOk = true;
        dryRunNoChange = false;
        dryRunFormFingerprint = formFingerprint(nextValue);
        dryRunServerFingerprint = display.fingerprint.trim();
        dryRunFileSha = display.currentFileSha.trim();
        dryRunExpectedEmbed = String(
          display.before?.embedCode ?? display.current?.embedCode ?? liveCurrentEmbed,
        ).trim();
        dryRunExpectedVideoId =
          display.before?.videoId != null
            ? String(display.before.videoId).trim() || null
            : display.current?.videoId == null
              ? liveCurrentVideoId || null
              : String(display.current.videoId).trim() || null;
        // Reflect GitHub-read current into UI (not build-time snapshot alone).
        if (dryRunExpectedEmbed) {
          applyLiveCurrent(dryRunExpectedEmbed, dryRunExpectedVideoId);
        }
        renderDryRunSuccess(display);
      } else {
        dryRunOk = false;
        dryRunNoChange = false;
        dryRunFormFingerprint = null;
        dryRunServerFingerprint = null;
        dryRunFileSha = null;
        dryRunExpectedEmbed = null;
        dryRunExpectedVideoId = null;
        showResultJson({
          ...display,
          didWrite: false,
          dbWrite: false,
          networkWrite: false,
        });
      }
    } catch {
      dryRunOk = false;
      dryRunNoChange = false;
      dryRunFormFingerprint = null;
      dryRunServerFingerprint = null;
      dryRunFileSha = null;
      showResultJson({
        ok: false,
        error: "dry_run_request_failed",
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
      });
    } finally {
      dryRunInFlight = false;
      void refreshSaveGate();
    }
  }

  async function runSave() {
    if (saveInFlight || dryRunInFlight) return;
    if (!(saveBtn instanceof HTMLButtonElement) || saveBtn.disabled) return;

    const nextValue = readNextValue();
    const formMatches =
      dryRunOk &&
      dryRunFormFingerprint != null &&
      formFingerprint(nextValue) === dryRunFormFingerprint &&
      dryRunServerFingerprint != null &&
      dryRunFileSha != null;
    if (!formMatches || !dryRunExpectedEmbed || !dryRunServerFingerprint) {
      invalidateDryRun();
      return;
    }

    const endpoint = String(deps.saveEndpoint ?? "").trim();
    if (!endpoint || !deps.assertSaveEndpointSafe?.(endpoint) || endpoint.includes(productionStop)) {
      applySaveButtonUi(false, "Save endpoint が未設定またはブロックされています");
      return;
    }
    if (!saveArmed) {
      applySaveButtonUi(false, "env arm が無効です");
      return;
    }
    if (!deps.buildSaveEndpointRequest || !deps.sanitizeSaveDisplay) {
      applySaveButtonUi(false, "Save wiring incomplete");
      return;
    }

    const token = await deps.getAccessToken?.();
    if (!token) {
      invalidateDryRun();
      applySaveButtonUi(false, "ログインが必要です");
      return;
    }

    saveInFlight = true;
    void refreshSaveGate();
    if (resultEl instanceof HTMLElement) {
      resultEl.hidden = false;
      resultEl.textContent = "Save リクエスト送信中…（GitHub Contents commit）";
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const anon = String(deps.anonKey ?? "").trim();
      if (anon) headers.apikey = anon;

      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(
          deps.buildSaveEndpointRequest({
            nextValue,
            expectedBefore: {
              embedCode: dryRunExpectedEmbed,
              videoId: dryRunExpectedVideoId,
            },
            fingerprint: dryRunServerFingerprint,
            requestId: `ui-${Date.now()}`,
          }),
        ),
      });
      let bodyData: unknown = null;
      try {
        bodyData = await res.json();
      } catch {
        bodyData = { error: "non-JSON response" };
      }

      if (res.status === 409 || deps.isSaveConflictResponse?.(bodyData)) {
        showResultJson({
          ok: false,
          httpStatus: res.status,
          error: "conflict",
          message: conflictMessage,
          body: bodyData,
          hint: "再度 dry-run で GitHub current を取得してください",
        });
        invalidateDryRun();
        applySaveButtonUi(false, conflictMessage);
        return;
      }

      const display = deps.sanitizeSaveDisplay(bodyData, res.status);
      if (display.indeterminate) {
        showResultJson({
          ...display,
          ok: false,
          didWrite: false,
          dbWrite: false,
          networkWrite: false,
          message:
            "indeterminate / verification_required — 成功扱いしません。GitHub current を dry-run で再確認してください（自動再送しません）",
        });
        invalidateDryRun();
        return;
      }

      if (display.ok && display.didWrite === true && !display.unsafeWriteFlags) {
        const nextEmbed = String(
          display.after?.embedCode ?? display.next?.embedCode ?? nextValue,
        ).trim();
        const nextVid = String(
          display.after?.videoId ??
            display.next?.videoId ??
            parseVideoId(nextEmbed) ??
            "",
        ).trim();
        applyLiveCurrent(nextEmbed, nextVid);
        if (nextInput instanceof HTMLInputElement || nextInput instanceof HTMLTextAreaElement) {
          nextInput.value = nextEmbed;
        }
        showResultJson({
          ...display,
          message:
            "Save committed（GitHub Contents）· 再disabled。restore する場合は original URL で再度 dry-run → Save",
        });
        invalidateDryRun();
        applySaveButtonUi(
          false,
          "Save 成功後は再disabledです。続けて変更 / restore する場合は再度「変更を確認」してください",
        );
      } else {
        showResultJson({
          ...display,
          didWrite: false,
          dbWrite: false,
          networkWrite: false,
        });
        invalidateDryRun();
      }
    } catch {
      showResultJson({
        ok: false,
        error: "save_request_failed",
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
        message:
          "Save 応答が不明瞭です。成功扱いしません。GitHub current を dry-run で再確認してください（自動再送しません）",
      });
      invalidateDryRun();
    } finally {
      saveInFlight = false;
      void refreshSaveGate();
    }
  }

  function resetToBaseline() {
    if (nextInput instanceof HTMLInputElement || nextInput instanceof HTMLTextAreaElement) {
      nextInput.value = "";
    }
    if (resultEl instanceof HTMLElement) {
      resultEl.hidden = true;
      resultEl.textContent = "";
    }
    setLocalValidation("未保存の変更はありません", null);
    invalidateDryRun();
    if (statusEl instanceof HTMLElement) {
      statusEl.textContent = "現在値を表示中 · 未保存変更なし";
    }
  }

  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
    });
  }

  if (nextInput instanceof HTMLInputElement || nextInput instanceof HTMLTextAreaElement) {
    ["input", "change"].forEach((evt) => {
      nextInput.addEventListener(evt, () => {
        updateLocalValidationFromInput();
        if (
          dryRunOk &&
          dryRunFormFingerprint != null &&
          formFingerprint(readNextValue()) !== dryRunFormFingerprint
        ) {
          invalidateDryRun();
        }
        void refreshSaveGate();
      });
    });
  }

  if (dryRunBtn instanceof HTMLButtonElement) {
    dryRunBtn.addEventListener("click", () => {
      void runDryRun();
    });
  }

  if (cancelBtn instanceof HTMLButtonElement) {
    cancelBtn.addEventListener("click", () => {
      resetToBaseline();
    });
  }

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener("click", () => {
      void runSave();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshSaveGate();
  });
  window.addEventListener("focus", () => {
    void refreshSaveGate();
  });
  window.addEventListener("gosaki-admin-auth-changed", () => {
    void refreshSaveGate();
  });

  updateLocalValidationFromInput();
  void refreshSaveGate();
}
