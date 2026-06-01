import { requireAdminSession } from "../../lib/admin/require-admin-session";

void (async () => {
  await requireAdminSession();
})();
