/** @file Tests for the Supabase client: a bad build setting turns the board off instead of stopping the app. */

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('supabase', () => {
  it('is null without Supabase settings', async () => {
    expect((await import('./supabaseClient')).supabase).toBeNull()
  })
  it('is null, without throwing, when the project URL is malformed', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'projet.supabase.co ')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.resetModules()
    expect((await import('./supabaseClient')).supabase).toBeNull()
  })
})
