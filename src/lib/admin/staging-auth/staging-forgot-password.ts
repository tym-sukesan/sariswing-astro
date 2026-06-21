/**
 * G-9j5a — Staging shell forgot-password page (anon client only).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  getStagingResetPasswordRedirectUrl,
  STAGING_ADMIN_HOME_PATH,
} from "./staging-auth-paths";
import { getStagingSupabaseClient } from "./supabase-staging-auth-client";

type StagingAuthPageConfig = {
  stagingAuthEnabled: boolean;
  adminAuthProvider: string;
  supabaseConfigured: boolean;
};

const readStagingAuthPageConfig = (): StagingAuthPageConfig => {
  const config = document.getElementById("staging-auth-page-config");

  return {
    stagingAuthEnabled:
      config?.getAttribute("data-staging-auth-enabled") === "true",
    adminAuthProvider:
      config?.getAttribute("data-admin-auth-provider") ?? "",
    supabaseConfigured:
      config?.getAttribute("data-supabase-configured") === "true",
  };
};

function setError(message: string): void {
  const el = document.getElementById("staging-forgot-password-error");
  if (!el) return;

  el.textContent = message;
  el.hidden = !message;
}

function showSuccess(): void {
  document
    .getElementById("staging-forgot-password-form")
    ?.classList.add("is-hidden");

  document
    .getElementById("staging-forgot-password-success")
    ?.classList.remove("is-hidden");
}

async function redirectIfAlreadyLoggedIn(): Promise<void> {
  const pageConfig = readStagingAuthPageConfig();

  if (
    !pageConfig.stagingAuthEnabled ||
    pageConfig.adminAuthProvider !== "supabase" ||
    !pageConfig.supabaseConfigured
  ) {
    return;
  }

  const config = getStagingAuthConfig();
  const client = getStagingSupabaseClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
  );

  const {
    data: { session },
  } = await client.auth.getSession();

  if (session) {
    window.location.replace(STAGING_ADMIN_HOME_PATH);
  }
}

export function initStagingForgotPasswordPage(): void {
  void redirectIfAlreadyLoggedIn();

  const form = document.getElementById("staging-forgot-password-form");
  const submitBtn = document.getElementById("staging-forgot-password-submit");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    void (async () => {
      const pageConfig = readStagingAuthPageConfig();

      if (
        !pageConfig.stagingAuthEnabled ||
        pageConfig.adminAuthProvider !== "supabase" ||
        !pageConfig.supabaseConfigured
      ) {
        setError(
          "ステージング Auth が無効です。ENABLE_ADMIN_STAGING_AUTH=true と PUBLIC_ADMIN_AUTH_PROVIDER=supabase を設定してください。",
        );
        return;
      }

      const config = getStagingAuthConfig();

      const emailInput = document.getElementById(
        "staging-forgot-password-email",
      );
      const email =
        emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";

      if (!email) {
        setError("メールアドレスを入力してください。");
        return;
      }

      setError("");

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中...";
      }

      try {
        const client = getStagingSupabaseClient(
          config.supabaseUrl,
          config.supabaseAnonKey,
        );

        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: getStagingResetPasswordRedirectUrl(),
        });

        if (error) {
          setError(`送信に失敗しました: ${error.message}`);
          return;
        }

        showSuccess();
      } finally {
        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          submitBtn.textContent = "パスワード再設定メールを送る";
        }
      }
    })();
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initStagingForgotPasswordPage();
  });
}