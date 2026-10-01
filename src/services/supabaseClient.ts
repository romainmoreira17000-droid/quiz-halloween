/** @file The one Supabase client of the app (public anon key only), or null when the build has no usable Supabase settings. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Builds the client, or null when createClient refuses the settings. */
function build(projectUrl: string, anonKey: string): SupabaseClient | null {
  try {
    return createClient(projectUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  } catch {
    // createClient throws at once on a malformed URL (typo in the deploy variable): this module is loaded with the
    // app, so the throw would stop every tablet. The remote board is simply off instead.
    return null
  }
}

/**
 * Supabase client; null without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (unit tests, local dev without
 * .env.local) or with a malformed URL, which turns the remote board off. No login: nothing to keep in localStorage.
 */
export const supabase = url && key ? build(url, key) : null
