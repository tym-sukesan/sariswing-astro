import { supabaseAdmin } from "../supabase-admin";

const LOGIN_PATH = "/admin/login/";

export async function requireAdminSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabaseAdmin.auth.getSession();

  if (!session) {
    const next = encodeURIComponent(window.location.pathname);
    window.location.replace(`${LOGIN_PATH}?next=${next}`);
    return false;
  }

  return true;
}

export async function signOutAdmin() {
  await supabaseAdmin.auth.signOut();
  window.location.replace(LOGIN_PATH);
}
