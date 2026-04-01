import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you should only use in a secure server-side environment
// Never expose these keys to the client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
