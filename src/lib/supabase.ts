import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vsbvndwuajjhnzpohghh.supabase.co";
const supabaseKey = "sb_publishable_sGvemzdx-fv_aKwzXebCYw_K1fVIwWa";

export const supabase = createClient(supabaseUrl, supabaseKey);