/**
 * G-9j5a — Staging shell reset-password page (recovery session + updateUser).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  STAGING_ADMIN_HOME_PATH,
} from "./staging-auth-paths";
import {
  ensureStagingRecoverySession,
  parseStagingAuthHashError,
  signOutStagingAfterPasswordReset,
  updateStagingAuthPassword,
  clearStagingAuthHashFromUrl,
} from "./staging-password-reset-callback";

const MIN_PASSWORD_LENGTH = 8;

function setError(message: string): void {
  const el = document.getElementById("staging-reset-password-error");
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function showInvalidLinkState(): void {
  document.getElementById("staging-reset-password-form")?.classList.add("is-hidden");
  document.getElementById("staging-reset-password-invalid")?.classList.remove("is-hidden");
}

export function initStagingResetPasswordPage(): void {
  void (async () => {
    const config = getStagingAuthConfig();
    if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
      setError(
        "ステージング Auth が無効です。ENABLE_ADMIN_STAGING_AUTH=true と PUBLIC_ADMIN_AUTH_PROVIDER=supabase を設定してください。",
      );
      showInvalidLinkState();
      return;
    }

    const hashError = parseStagingAuthHashError();
    if (hashError) {
      setError(hashError);
      showInvalidLinkState();
      return;
    }

    const recovery = await ensureStagingRecoverySession(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
    if (!recovery.ok) {
      setError(recovery.error ?? "リンクが無効か期限切れです。");
      showInvalidLinkState();
      return;
    }

    const form = document.getElementById("staging-reset-password-form");
    const submitBtn = document.getElementById("staging-reset-password-submit");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        const passwordInput = document.getElementById("staging-reset-password-new");
        const confirmInput = document.getElementById("staging-reset-password-confirm");

        const password =
          passwordInput instanceof HTMLInputElement ? passwordInput.value : "";
        const confirm =
          confirmInput instanceof HTMLInputElement ? confirmInput.value : "";

        if (!password || !confirm) {
          setError("新しいパスワードを入力してください。");
          return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
          setError(`パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`);
          return;
        }

        if (password !== confirm) {
          setError("パスワードが一致しません。");
          return;
        }

        setError("");

        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = true;
          submitBtn.textContent = "保存中...";
        }

        const result = await updateStagingAuthPassword(
          config.supabaseUrl,
          config.supabaseAnonKey,
          password,
        );

        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          submitBtn.textContent = "パスワードを保存";
        }

        if (!result.ok) {
          setError(result.error ?? "保存に失敗しました。");
          return;
        }

        await signOutStagingAfterPasswordReset(config.supabaseUrl, config.supabaseAnonKey);
        clearStagingAuthHashFromUrl();
        window.location.replace(`${STAGING_ADMIN_HOME_PATH}?reset=success`);
      })();
    })();
  })();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initStagingResetPasswordPage();
  });
}
