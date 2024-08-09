import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  persistSession: true,
  autoRefreshToken: true,
  headers: {
    Accept: 'application/json', // Ensure that JSON is accepted
  },
});
