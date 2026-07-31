// js/config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://kuclhqlrzcmryrtofssg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dEyNvK-cmuW2oSYDvlbZTg_-xdBzoCV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);