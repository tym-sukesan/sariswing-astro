/** パスワード再設定メールのリダイレクト先（Supabase Dashboard の Redirect URLs に登録） */
export function getResetPasswordRedirectUrl(): string {
  return `${window.location.origin}/admin/reset-password/`;
}

export const ADMIN_LOGIN_PATH = "/admin/login/";
export const ADMIN_FORGOT_PASSWORD_PATH = "/admin/forgot-password/";
export const ADMIN_RESET_PASSWORD_PATH = "/admin/reset-password/";
