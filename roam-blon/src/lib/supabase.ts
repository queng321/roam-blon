import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// 1. For regular Users (Customer tab)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. For the Admin (Admin tab)
// We add a 'storageKey' so it doesn't overwrite the User session
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'admin-session-lock',
    persistSession: true,
  },
})