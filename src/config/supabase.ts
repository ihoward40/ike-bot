import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "placeholder-key";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn("⚠️  Warning: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
