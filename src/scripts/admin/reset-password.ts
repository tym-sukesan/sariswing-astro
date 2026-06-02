import { ADMIN_LOGIN_PATH } from "../../lib/admin/auth-paths";
import { supabaseAdmin } from "../../lib/supabase-admin";

function setError(message: string) {
  const el = document.getElementById("resetPasswordError");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-hidden", !message);
}

function showInvalidLinkState() {
  document.getElementById("resetPasswordForm")?.classList.add("is-hidden");
  document.getElementById("resetPasswordInvalid")?.classList.remove("is-hidden");
}

/** メールリンク経由の recovery セッションを待つ */
async function ensureRecoverySession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();
  if (session) return true;

  return new Promise((resolve) => {
    const {
      data: { subscription },
    } = supabaseAdmin.auth.onAuthStateChange((event, nextSession) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "SIGNED_IN" && nextSession)
      ) {
        subscription.unsubscribe();
        resolve(true);
      }
    });

    window.setTimeout(() => {
      subscription.unsubscribe();
      void supabaseAdmin.auth.getSession().then(({ data: { session: retry } }) => {
        resolve(Boolean(retry));
      });
    }, 2500);
  });
}

export function initAdminResetPassword() {
  void (async () => {
    const ok = await ensureRecoverySession();
    if (!ok) {
      showInvalidLinkState();
      return;
    }

    const form = document.getElementById("resetPasswordForm");
    const submitBtn = document.getElementById("resetPasswordSubmit");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        const passwordInput = document.getElementById("resetPasswordNew");
        const confirmInput = document.getElementById("resetPasswordConfirm");

        const password =
          passwordInput instanceof HTMLInputElement ? passwordInput.value : "";
        const confirm =
          confirmInput instanceof HTMLInputElement ? confirmInput.value : "";

        if (!password || !confirm) {
          setError("新しいパスワードを入力してください。");
          return;
        }

        if (password.length < 6) {
          setError("パスワードは6文字以上で入力してください。");
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

        const { error } = await supabaseAdmin.auth.updateUser({ password });

        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          submitBtn.textContent = "パスワードを保存";
        }

        if (error) {
          setError(`保存に失敗しました: ${error.message}`);
          return;
        }

        await supabaseAdmin.auth.signOut();
        window.location.replace(`${ADMIN_LOGIN_PATH}?reset=success`);
      })();
    })();
  })();
}

initAdminResetPassword();
