/** @file Types of the build-time settings read through import.meta.env. */
interface ImportMetaEnv {
  /** Supabase project URL; missing: remote board off. */
  readonly VITE_SUPABASE_URL?: string
  /** Public anon key of that project (never the service_role key). */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
