import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "PUBLIC_SUPABASE_URL と PUBLIC_SUPABASE_ANON_KEY を設定してください（.env.example を参照）"
  );
}

/** 管理画面用（Supabase Auth セッションを保持。公開サイト用 supabase.ts とは分離） */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshSession: true,
    detectSessionInUrl: true,
  },
});
