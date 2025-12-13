import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('example')) {
  console.warn('Supabase credentials not configured. Using mock client for development.');
  // Create a mock supabase client for development
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: function() { return this; },
      single: function() { return this; },
    }),
  } as any;
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
