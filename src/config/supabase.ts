import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  logger.warn('Supabase credentials not found. Database operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
