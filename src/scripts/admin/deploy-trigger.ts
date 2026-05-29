import { supabase } from "../../lib/supabase";

function getDeploySecret() {
  return import.meta.env.PUBLIC_DEPLOY_SHARED_SECRET?.trim() ?? "";
}

export function initAdminDeployBar() {
  const button = document.getElementById("triggerDeploy");
  const message = document.getElementById("deployMessage");
  const hint = document.getElementById("deployHint");

  if (!button || !message) return;

  const deploySecret = getDeploySecret();

  if (!deploySecret) {
    message.textContent =
      "PUBLIC_DEPLOY_SHARED_SECRET が未設定です。.env に設定して再ビルドしてください。";
    button.setAttribute("disabled", "true");
    return;
  }

  button.addEventListener("click", async () => {
    if (
      !confirm(
        "公開サイトの再ビルド・再デプロイを開始します。\n数分かかります。よろしいですか？"
      )
    ) {
      return;
    }

    button.setAttribute("disabled", "true");
    message.textContent = "GitHub Actions を起動しています…";
    message.classList.remove("is-error", "is-success");
    if (hint) hint.textContent = "";

    try {
      const { data, error } = await supabase.functions.invoke("trigger-deploy", {
        method: "POST",
        headers: {
          "x-deploy-secret": deploySecret,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const payload = data as { ok?: boolean; error?: string; detail?: string; message?: string };

      if (!payload?.ok) {
        const detail = payload?.detail ? ` (${payload.detail})` : "";
        throw new Error((payload?.error ?? "起動に失敗しました") + detail);
      }

      message.textContent =
        payload.message ?? "デプロイを開始しました。GitHub Actions の完了をお待ちください。";
      message.classList.add("is-success");
      if (hint) {
        hint.textContent =
          "反映まで数分かかります。Actions タブで deploy ワークフローの進行を確認できます。";
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      message.textContent = `起動に失敗しました: ${text}`;
      message.classList.add("is-error");
    } finally {
      button.removeAttribute("disabled");
    }
  });
}

initAdminDeployBar();
