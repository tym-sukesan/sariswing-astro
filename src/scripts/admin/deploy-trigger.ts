import { fetchDeployStatus, triggerDeploy, type DeployRunStatus } from "../../lib/admin/deploy-api";
import { supabaseAdmin } from "../../lib/supabase-admin";

const STORAGE_KEY = "sariswing_last_deploy";
const POLL_INTERVAL_MS = 12_000;
const MAX_POLL_DURATION_MS = 45 * 60 * 1000;
const BUTTON_LABEL_IDLE = "公開サイトを更新";
const BUTTON_LABEL_BUSY = "デプロイ中...";

type StoredDeploy = {
  startedAt: string;
  completedAt?: string;
  status: DeployRunStatus;
  runId?: number | null;
};

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

function setButtonBusy(button: HTMLButtonElement, busy: boolean) {
  button.disabled = busy;
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

function renderStatus(
  statusEl: HTMLElement,
  status: DeployRunStatus,
  startedAt?: string
) {
  statusEl.classList.remove("is-error", "is-success", "is-running");
  statusEl.textContent = `${statusLabel(status)} ${statusText(status)}`;

  if (status === "success") statusEl.classList.add("is-success");
  else if (status === "failure") statusEl.classList.add("is-error");
  else statusEl.classList.add("is-running");

  const messageEl = document.getElementById("deployMessage");
  if (messageEl && startedAt) {
    messageEl.textContent = `更新の開始を受け付けました（${formatDateTime(startedAt)}）`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollDeployStatus(runId: number | null, startedAt: string) {
  const statusEl = document.getElementById("deployStatus");
  const hintEl = document.getElementById("deployHint");
  const lastDeployEl = document.getElementById("deployLastRun");
  const button = document.getElementById("triggerDeploy");

  if (!statusEl) return;

  const pollStarted = Date.now();
  let currentRunId = runId;

  while (Date.now() - pollStarted < MAX_POLL_DURATION_MS) {
    const payload = await fetchDeployStatus(currentRunId);

    if (!payload?.ok || !payload.status) {
      throw new Error(payload?.error ?? "状態の取得に失敗しました");
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

      if (button instanceof HTMLButtonElement) {
        setButtonBusy(button, false);
      }
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  if (hintEl) {
    hintEl.textContent =
      "反映に時間がかかっています。しばらくしてからページを再読み込みし、最終の反映日時をご確認ください。";
  }
  if (button instanceof HTMLButtonElement) {
    setButtonBusy(button, false);
  }
}

export function initAdminDeployBar() {
  const button = document.getElementById("triggerDeploy");
  const message = document.getElementById("deployMessage");
  const statusEl = document.getElementById("deployStatus");
  const hint = document.getElementById("deployHint");
  const lastDeploy = document.getElementById("deployLastRun");

  if (!(button instanceof HTMLButtonElement) || !message || !statusEl) return;

  renderLastDeploy(lastDeploy);

  void (async () => {
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession();

    if (!session) {
      message.textContent = "ログイン後に公開サイトを更新できます。";
      button.disabled = true;
      return;
    }

    button.addEventListener("click", async () => {
      const {
        data: { session: clickSession },
      } = await supabaseAdmin.auth.getSession();

      if (!clickSession) {
        message.textContent = "ログインが必要です。再度ログインしてください。";
        message.classList.add("is-error");
        return;
      }

      if (
        !confirm(
          "公開サイトを最新の内容に更新します。\n数分かかることがあります。よろしいですか？"
        )
      ) {
        return;
      }

      setButtonBusy(button, true);
      message.textContent = "";
      message.classList.remove("is-error", "is-success");
      statusEl.textContent = "🟡 実行中 更新を準備しています…";
      statusEl.classList.remove("is-error", "is-success");
      statusEl.classList.add("is-running");
      if (hint) hint.textContent = "";

      try {
        const payload = await triggerDeploy();

        if (!payload?.ok) {
          const detail = payload?.detail ? `（${payload.detail}）` : "";
          throw new Error((payload?.error ?? "更新の開始に失敗しました") + detail);
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

        await pollDeployStatus(payload.runId ?? null, startedAt);
      } catch (err) {
        const text = err instanceof Error ? err.message : "不明なエラーが発生しました。";
        message.textContent = `更新を開始できませんでした。${text}`;
        message.classList.add("is-error");
        statusEl.textContent = "🔴 失敗 更新を開始できませんでした";
        statusEl.classList.remove("is-running");
        statusEl.classList.add("is-error");
        if (hint) hint.textContent = "しばらくしてから再度お試しください。";
        setButtonBusy(button, false);
      }
    });
  })();
}

initAdminDeployBar();
