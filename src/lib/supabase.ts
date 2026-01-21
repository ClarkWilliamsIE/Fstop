// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gbxvqqzsseshuuvcotjs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4-X5paN2OL95gGDpDkJuOA_2nSMTfpO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
