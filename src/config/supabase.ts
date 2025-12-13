import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient<any, "public", any>;

// Only create client if we have valid credentials
if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
  console.warn('Supabase credentials not found. Database operations will fail.');
  // Create a dummy client to avoid errors
  supabase = createClient('https://placeholder.supabase.co', 'placeholder_key');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
    supabase = createClient('https://placeholder.supabase.co', 'placeholder_key');
  }
}

export { supabase };
