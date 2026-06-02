import { getResetPasswordRedirectUrl } from "../../lib/admin/auth-paths";
import { supabaseAdmin } from "../../lib/supabase-admin";

function setError(message: string) {
  const el = document.getElementById("forgotPasswordError");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-hidden", !message);
}

function showSuccess() {
  document.getElementById("forgotPasswordForm")?.classList.add("is-hidden");
  document.getElementById("forgotPasswordSuccess")?.classList.remove("is-hidden");
}

async function redirectIfAlreadyLoggedIn() {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();

  if (session) {
    window.location.replace("/admin/");
  }
}

export function initAdminForgotPassword() {
  void redirectIfAlreadyLoggedIn();

  const form = document.getElementById("forgotPasswordForm");
  const submitBtn = document.getElementById("forgotPasswordSubmit");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      const emailInput = document.getElementById("forgotPasswordEmail");
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

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: getResetPasswordRedirectUrl(),
      });

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = "再設定メールを送信";
      }

      if (error) {
        setError(`送信に失敗しました: ${error.message}`);
        return;
      }

      showSuccess();
    })();
  });
}

initAdminForgotPassword();
