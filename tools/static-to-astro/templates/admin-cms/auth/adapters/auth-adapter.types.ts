/**
 * CMS Kit Admin Auth adapter types (G-5y-b scaffold).
 * No Supabase client. No runtime connection.
 */

export type AdminRole = "admin" | "editor" | "viewer";

export type AdminPermission =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "duplicate"
  | "upload"
  | "stagingPublish"
  | "productionPublish"
  | "settingsManage";

export type AdminModule =
  | "dashboard"
  | "profile"
  | "schedule"
  | "discography"
  | "links"
  | "news"
  | "media"
  | "publish"
  | "settings";

export type AdminAuthStatus =
  | "unknown"
  | "signed-out"
  | "signed-in"
  | "admin"
  | "denied"
  | "mock";

export type AdminAuthProvider = "mock" | "supabase";

export interface AdminSession {
  status: AdminAuthStatus;
  email?: string;
  role?: AdminRole;
  provider: AdminAuthProvider;
  connectedToRuntime: false;
  productionReady: false;
}

export interface AdminAuthAdapter {
  provider: AdminAuthProvider;
  connectedToRuntime: false;
  productionReady: false;
  getSession(): Promise<AdminSession>;
  signIn?(email: string, password: string): Promise<AdminSession>;
  signOut?(): Promise<void>;
  resetPassword?(email: string): Promise<void>;
}

/** Reserved for G-5y-d+. Not implemented in G-5y-b. */
export type SupabaseAuthAdapter = AdminAuthAdapter & {
  provider: "supabase";
};
