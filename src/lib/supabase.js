// ─────────────────────────────────────────────────────────────
//  Cliente Supabase (backend do FlixOn)
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xblsyamjutnxhwzwncpo.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_gzJz63FgW2ii6tKb9gYzGg_8RzEb_KK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
