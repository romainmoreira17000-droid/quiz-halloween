/**
 * @file Checks the remote board database with the public anon key, as an intruder would see it:
 * `npm run check:board` (reads .env.local; asks the evening code in BOARD_CODE). `--full` also fills 12 fake teams
 * to check the 13th is refused, then empties the board: only before the evening.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const code = process.env.BOARD_CODE
if (!url || !key || !code) {
  console.error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (.env.local) et BOARD_CODE sont nécessaires.')
  process.exit(2)
}
const db = createClient(url, key, { auth: { persistSession: false } })
const state = { status: 'home' }
let failures = 0

async function expectRefused(label: string, run: () => PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await run()
  if (error) console.log(`ok     ${label}`)
  else { failures++; console.log(`ÉCHEC  ${label} : accepté`) }
}
async function expectAccepted(label: string, run: () => PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await run()
  if (!error) console.log(`ok     ${label}`)
  else { failures++; console.log(`ÉCHEC  ${label} : ${error.message}`) }
}

await expectRefused('lecture directe de team_status', () => db.from('team_status').select())
await expectRefused('lecture directe de evening_secret', () => db.from('evening_secret').select())
await expectRefused('écriture directe dans team_status', () => db.from('team_status').insert({ team: 'x', fingerprint: 'x', state }))
await expectRefused('appel de check_evening_code', () => db.rpc('check_evening_code', { p_code: code }))
await expectRefused('read_board avec un mauvais code', () => db.rpc('read_board', { p_code: 'mauvais-code' }))
await expectRefused('push_team_state avec un mauvais code', () => db.rpc('push_team_state', { p_code: 'mauvais-code', p_team: 'x', p_fingerprint: 'x', p_state: state }))
await expectRefused('reset_board avec un mauvais code', () => db.rpc('reset_board', { p_code: 'mauvais-code' }))
await expectRefused('nom d’équipe de 41 caractères', () => db.rpc('push_team_state', { p_code: code, p_team: 'x'.repeat(41), p_fingerprint: 'x', p_state: state }))
await expectRefused('état de plus de 2 Ko', () => db.rpc('push_team_state', { p_code: code, p_team: 'test-taille', p_fingerprint: 'x', p_state: { pad: 'x'.repeat(3000) } }))
await expectAccepted('read_board avec le bon code', () => db.rpc('read_board', { p_code: code }))

if (process.argv.includes('--full')) {
  const { data } = await db.rpc('read_board', { p_code: code })
  if ((data as { teams: unknown[] } | null)?.teams.length) {
    console.error('Le tableau n’est pas vide : --full l’effacerait. Faire « Nouvelle soirée » d’abord.')
    process.exit(2)
  }
  for (let i = 1; i <= 12; i++) {
    await expectAccepted(`équipe de test ${i}`, () => db.rpc('push_team_state', { p_code: code, p_team: `test-${i}`, p_fingerprint: 'x', p_state: state }))
  }
  await expectRefused('13e équipe', () => db.rpc('push_team_state', { p_code: code, p_team: 'test-13', p_fingerprint: 'x', p_state: state }))
  await expectAccepted('reset_board avec le bon code', () => db.rpc('reset_board', { p_code: code }))
}

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} vérification(s) en échec.`)
process.exit(failures === 0 ? 0 : 1)
