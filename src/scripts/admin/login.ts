import { supabaseAdmin } from "../../lib/supabase-admin";

const DEFAULT_NEXT = "/admin/";
const LOGIN_PATH_PREFIX = "/admin/login";

/** next クエリがあればその管理画面へ。なければ /admin/ */
function resolveAdminNextPath(raw: string | null | undefined): string {
  if (!raw?.trim()) return DEFAULT_NEXT;

  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return DEFAULT_NEXT;
  }

  if (!path.startsWith("/admin")) return DEFAULT_NEXT;

  const base = path.replace(/\/+$/, "") || "/admin";
  if (base === LOGIN_PATH_PREFIX || base.startsWith(`${LOGIN_PATH_PREFIX}/`)) {
    return DEFAULT_NEXT;
  }

  if (base === "/admin") return "/admin/";
  if (!base.startsWith("/admin/")) return DEFAULT_NEXT;

  return path.endsWith("/") ? path : `${base}/`;
}

function getNextPath() {
  const params = new URLSearchParams(window.location.search);
  return resolveAdminNextPath(params.get("next"));
}

async function redirectIfAlreadyLoggedIn() {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();

  if (session) {
    window.location.replace(getNextPath());
  }
}

function setLoginError(message: string) {
  const el = document.getElementById("loginError");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-hidden", !message);
}

export function initAdminLogin() {
  void redirectIfAlreadyLoggedIn();

  const form = document.getElementById("adminLoginForm");
  const submitBtn = document.getElementById("loginSubmit");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");

      const email =
        emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
      const password =
        passwordInput instanceof HTMLInputElement ? passwordInput.value : "";

      if (!email || !password) {
        setLoginError("メールアドレスとパスワードを入力してください。");
        return;
      }

      setLoginError("");

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = true;
        submitBtn.textContent = "ログイン中...";
      }

      const { error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = "ログイン";
      }

      if (error) {
        setLoginError(`ログインに失敗しました: ${error.message}`);
        return;
      }

      window.location.replace(getNextPath());
    })();
  });
}

initAdminLogin();
