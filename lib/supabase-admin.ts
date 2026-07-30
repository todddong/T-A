import { createClient } from '@supabase/supabase-js'

// Server-only client that bypasses RLS using the service role key.
// Never import this from a Client Component — it must only run in API
// routes / Server Components.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
