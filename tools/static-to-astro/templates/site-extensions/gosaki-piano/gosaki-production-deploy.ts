/**
 * Gosaki production Deploy client — portal /admin/ only.
 * Polls gosaki-production-deploy-status every 12s. In-flight lock prevents double dispatch.
 * Does not send repo / workflow / ref / site. Not a Save arm.
 */

export const GOSAKI_PRODUCTION_DEPLOY_TRIGGER_NAME = "gosaki-production-deploy-trigger";
export const GOSAKI_PRODUCTION_DEPLOY_STATUS_NAME = "gosaki-production-deploy-status";
export const GOSAKI_PRODUCTION_DEPLOY_POLL_INTERVAL_MS = 12_000;
export const GOSAKI_PRODUCTION_DEPLOY_MAX_POLL_MS = 45 * 60 * 1000;
export const GOSAKI_PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const GOSAKI_PRODUCTION_STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const STORAGE_KEY = "gosaki_production_last_deploy";
const BUTTON_LABEL_IDLE = "公開サイトを更新";
const BUTTON_LABEL_BUSY = "デプロイ中...";

export type DeployRunStatus = "running" | "success" | "failure";

type TriggerResponse = {
  ok?: boolean;
  error?: string;
  errors?: string[];
  detail?: string;
  startedAt?: string;
  runId?: number | null;
  status?: DeployRunStatus;
  reasonCode?: string;
};

type StatusResponse = {
  ok?: boolean;
  error?: string;
  errors?: string[];
  runId?: number;
  status?: DeployRunStatus;
  runCreatedAt?: string;
  runUpdatedAt?: string;
  completedAt?: string | null;
};

type StoredDeploy = {
  startedAt: string;
  completedAt?: string;
  status: DeployRunStatus;
  runId?: number | null;
};

let deployInFlight = false;

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: DeployRunStatus) {
  if (status === "success") return "🟢 成功";
  if (status === "failure") return "🔴 失敗";
  return "🟡 実行中";
}

function statusLabelPlain(status: DeployRunStatus) {
  if (status === "success") return "成功";
  if (status === "failure") return "失敗";
  return "実行中";
}

function statusText(status: DeployRunStatus) {
  if (status === "success") return "反映が完了しました";
  if (status === "failure") return "反映に失敗しました";
  return "反映を実行しています…";
}

function loadStoredDeploy(): StoredDeploy | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDeploy;
  } catch {
    return null;
  }
}

function saveStoredDeploy(data: StoredDeploy) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setButtonBusy(button: HTMLButtonElement, busy: boolean, armed: boolean) {
  deployInFlight = busy;
  button.disabled = busy || !armed;
  button.textContent = busy ? BUTTON_LABEL_BUSY : BUTTON_LABEL_IDLE;
}

function renderLastDeploy(el: HTMLElement | null) {
  if (!el) return;
  const stored = loadStoredDeploy();
  if (!stored) {
    el.textContent = "最終の反映: まだ記録がありません";
    return;
  }
  const when = stored.completedAt ?? stored.startedAt;
  el.textContent = `最終の反映: ${formatDateTime(when)}（${statusLabelPlain(stored.status)}）`;
}

function renderStatus(statusEl: HTMLElement, status: DeployRunStatus, startedAt?: string) {
  statusEl.classList.remove("is-error", "is-success", "is-running");
  statusEl.textContent = `${statusLabel(status)} ${statusText(status)}`;
  if (status === "success") statusEl.classList.add("is-success");
  else if (status === "failure") statusEl.classList.add("is-error");
  else statusEl.classList.add("is-running");

  const messageEl = document.getElementById("gosakiDeployMessage");
  if (messageEl && startedAt) {
    messageEl.textContent = `更新の開始を受け付けました（${formatDateTime(startedAt)}）`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveAccessToken(): Promise<string | null> {
  const body = document.body;
  const supabaseUrl = (body?.dataset.gosakiSupabaseUrl || "").trim();
  const supabaseAnonKey = (body?.dataset.gosakiSupabaseAnonKey || "").trim();
  const configured = body?.dataset.gosakiSupabaseAuthConfigured === "true";
  if (!configured || !supabaseUrl || !supabaseAnonKey) {
    return Promise.resolve(null);
  }
  const w = window as Window & {
    __gosakiAdminSupabaseClient?: {
      auth: { getSession: () => Promise<{ data?: { session?: { access_token?: string } } }> };
    };
    supabase?: {
      createClient?: (...args: unknown[]) => unknown;
      default?: { createClient?: (...args: unknown[]) => unknown };
    };
  };
  if (w.__gosakiAdminSupabaseClient) {
    return w.__gosakiAdminSupabaseClient.auth
      .getSession()
      .then((res) => res.data?.session?.access_token ?? null);
  }
  const lib = w.supabase;
  const createClient =
    lib && typeof lib.createClient === "function"
      ? lib.createClient
      : lib?.default && typeof lib.default.createClient === "function"
        ? lib.default.createClient
        : null;
  if (!createClient) return Promise.resolve(null);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  }) as {
    auth: { getSession: () => Promise<{ data?: { session?: { access_token?: string } } }> };
  };
  w.__gosakiAdminSupabaseClient = client;
  return client.auth.getSession().then((res) => res.data?.session?.access_token ?? null);
}

function functionUrl(supabaseUrl: string, name: string) {
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/${name}`;
}

function assertSafeSupabaseUrl(supabaseUrl: string): boolean {
  if (!supabaseUrl) return false;
  if (supabaseUrl.includes(GOSAKI_PRODUCTION_REF_STOP)) return false;
  return supabaseUrl.includes(GOSAKI_PRODUCTION_STAGING_REF);
}

async function postDeployFunction<T>(
  name: typeof GOSAKI_PRODUCTION_DEPLOY_TRIGGER_NAME | typeof GOSAKI_PRODUCTION_DEPLOY_STATUS_NAME,
  token: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const supabaseUrl = (document.body.dataset.gosakiSupabaseUrl || "").trim();
  const anonKey = (document.body.dataset.gosakiSupabaseAnonKey || "").trim();
  if (!assertSafeSupabaseUrl(supabaseUrl) || !anonKey) return null;
  const response = await fetch(functionUrl(supabaseUrl, name), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function pollDeployStatus(
  runId: number | null,
  startedAt: string,
  button: HTMLButtonElement,
  armed: boolean,
) {
  const statusEl = document.getElementById("gosakiDeployStatus");
  const hintEl = document.getElementById("gosakiDeployHint");
  const lastDeployEl = document.getElementById("gosakiDeployLastRun");
  if (!statusEl) return;

  const pollStarted = Date.now();
  let currentRunId = runId;

  while (Date.now() - pollStarted < GOSAKI_PRODUCTION_DEPLOY_MAX_POLL_MS) {
    const token = await resolveAccessToken();
    if (!token) throw new Error("ログインが必要です");
    const payload = await postDeployFunction<StatusResponse>(
      GOSAKI_PRODUCTION_DEPLOY_STATUS_NAME,
      token,
      currentRunId != null ? { runId: currentRunId } : {},
    );

    if (!payload?.ok || !payload.status) {
      throw new Error(payload?.error ?? payload?.errors?.join(" ") ?? "状態の取得に失敗しました");
    }

    if (payload.runId) currentRunId = payload.runId;
    renderStatus(statusEl, payload.status, startedAt);

    if (hintEl) {
      hintEl.textContent =
        payload.status === "running"
          ? "完了までこのページを開いたままお待ちください。通常は数分かかります。"
          : "";
    }

    if (payload.status !== "running") {
      const completedAt = payload.completedAt ?? payload.runUpdatedAt ?? new Date().toISOString();
      saveStoredDeploy({
        startedAt,
        completedAt,
        status: payload.status,
        runId: currentRunId,
      });
      renderLastDeploy(lastDeployEl);
      if (payload.status === "success" && hintEl) {
        hintEl.textContent = "公開サイトに最新の内容が反映されました。";
      }
      if (payload.status === "failure" && hintEl) {
        hintEl.textContent = "しばらく時間をおいてから、もう一度お試しください。";
      }
      setButtonBusy(button, false, armed);
      return;
    }

    await sleep(GOSAKI_PRODUCTION_DEPLOY_POLL_INTERVAL_MS);
  }

  const hintElTimeout = document.getElementById("gosakiDeployHint");
  if (hintElTimeout) {
    hintElTimeout.textContent =
      "反映に時間がかかっています。しばらくしてからページを再読み込みし、最終の反映日時をご確認ください。";
  }
  setButtonBusy(button, false, armed);
}

export function initGosakiProductionDeployBar() {
  const bar = document.querySelector("[data-gosaki-production-deploy-bar]");
  const button = document.getElementById("gosakiTriggerProductionDeploy");
  const message = document.getElementById("gosakiDeployMessage");
  const statusEl = document.getElementById("gosakiDeployStatus");
  const hint = document.getElementById("gosakiDeployHint");
  const lastDeploy = document.getElementById("gosakiDeployLastRun");

  if (!bar || !(button instanceof HTMLButtonElement) || !message || !statusEl) return;

  const armed =
    document.body.dataset.gosakiProductionDeployArmed === "true" ||
    bar.getAttribute("data-gosaki-production-deploy-armed") === "true";

  renderLastDeploy(lastDeploy);

  if (!armed) {
    button.disabled = true;
    return;
  }

  void (async () => {
    const token = await resolveAccessToken();
    if (!token) {
      message.textContent = "ログイン後に公開サイトを更新できます。";
      button.disabled = true;
      return;
    }

    button.addEventListener("click", async () => {
      if (deployInFlight || button.disabled) return;

      const clickToken = await resolveAccessToken();
      if (!clickToken) {
        message.textContent = "ログインが必要です。再度ログインしてください。";
        message.classList.add("is-error");
        return;
      }

      if (
        !confirm(
          "公開サイトを最新の内容に更新します。\n数分かかることがあります。よろしいですか？",
        )
      ) {
        return;
      }

      setButtonBusy(button, true, true);
      message.textContent = "";
      message.classList.remove("is-error", "is-success");
      statusEl.textContent = "🟡 実行中 更新を準備しています…";
      statusEl.classList.remove("is-error", "is-success");
      statusEl.classList.add("is-running");
      if (hint) hint.textContent = "";

      try {
        const payload = await postDeployFunction<TriggerResponse>(
          GOSAKI_PRODUCTION_DEPLOY_TRIGGER_NAME,
          clickToken,
          {},
        );

        if (!payload?.ok) {
          const detail = payload?.detail
            ? `（${payload.detail}）`
            : payload?.errors?.length
              ? `（${payload.errors.join(" ")}）`
              : "";
          throw new Error((payload?.error ?? payload?.reasonCode ?? "更新の開始に失敗しました") + detail);
        }

        const startedAt = payload.startedAt ?? new Date().toISOString();
        message.textContent = `更新の開始を受け付けました（${formatDateTime(startedAt)}）`;
        message.classList.add("is-success");

        saveStoredDeploy({
          startedAt,
          status: payload.status ?? "running",
          runId: payload.runId ?? null,
        });
        renderLastDeploy(lastDeploy);

        await pollDeployStatus(payload.runId ?? null, startedAt, button, true);
      } catch (err) {
        const text = err instanceof Error ? err.message : "不明なエラーが発生しました。";
        message.textContent = `更新を開始できませんでした。${text}`;
        message.classList.add("is-error");
        statusEl.textContent = "🔴 失敗 更新を開始できませんでした";
        statusEl.classList.remove("is-running");
        statusEl.classList.add("is-error");
        if (hint) hint.textContent = "しばらくしてから再度お試しください。";
        setButtonBusy(button, false, true);
      }
    });
  })();
}
