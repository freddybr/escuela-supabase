import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kuclhqlrzcmryrtofssg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dEyNvK-cmuW2oSYDvlbZTg_-xdBzoCV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

