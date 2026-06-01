import { requireAdminSession, signOutAdmin } from "../../lib/admin/require-admin-session";

void (async () => {
  const ok = await requireAdminSession();
  if (!ok) return;

  document.getElementById("adminLogout")?.addEventListener("click", () => {
    void signOutAdmin();
  });
})();
