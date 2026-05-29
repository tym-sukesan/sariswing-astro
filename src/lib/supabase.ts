import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "PUBLIC_SUPABASE_URL と PUBLIC_SUPABASE_ANON_KEY を設定してください（.env.example を参照）"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
