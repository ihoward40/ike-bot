import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️  Supabase credentials not configured. Database features will be unavailable.");
  // Create a dummy client that will fail gracefully
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
