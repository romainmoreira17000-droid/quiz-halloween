/** @file The one Supabase client of the app (public anon key only), or null when the build has no Supabase settings. */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client; null without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (unit tests, local dev without
 * .env.local), which turns the remote board off. No login: nothing to keep in localStorage.
 */
export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null
