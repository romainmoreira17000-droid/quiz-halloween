/** @file Remote board: a tablet sends its game, the animator's phone shows it; a tablet without network plays on. */
import { test, expect, type Page, type Route } from '@playwright/test'
import { typeAnswer } from './typing.js'

const RPC = 'https://board.e2e.test/rest/v1/rpc/'
type Push = { p_code: string; p_team: string; p_fingerprint: string; p_state: { status: string } }

/** Answers like PostgREST, CORS included (the fake server is on another origin than the app, with a preflight). */
async function reply(route: Route, status: number, body: unknown): Promise<void> {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
  return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) })
}

/** Sets the tablet up with an evening code, recording what it sends. */
async function setUpWithCode(page: Page, team: string, pushes: Push[]): Promise<void> {
  await page.route(`${RPC}push_team_state`, async (route) => {
    if (route.request().method() === 'POST') pushes.push(route.request().postDataJSON() as Push)
    await reply(route, 200, null)
  })
  await page.goto('./')
  await typeAnswer(page, '2710')
  await page.getByLabel('Code de soirée (facultatif)').fill('CITROUILLE-42')
  await page.getByRole('button', { name: team, exact: true }).click()
}

test('a tablet sends its game and the animator board shows it', async ({ page, context }) => {
  const pushes: Push[] = []
  await setUpWithCode(page, 'Sorcières', pushes)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect.poll(() => pushes.at(-1)?.p_state.status).toBe('playing')
  const last = pushes.at(-1)!
  expect(last).toMatchObject({ p_code: 'CITROUILLE-42', p_team: 'Sorcières' })

  const board = await context.newPage()
  await board.setViewportSize({ width: 360, height: 780 })
  await board.route(`${RPC}read_board`, (route) => reply(route, 200, {
    server_now: Date.now(), teams: [{ team: 'Sorcières', fingerprint: last.p_fingerprint, state: last.p_state, updated_at: Date.now() }],
  }))
  await board.goto('./?animateur')
  // Same browser context: the code typed on the tablet is already saved, the board opens at once.
  const card = board.getByRole('article', { name: 'Sorcières' })
  await expect(card).toContainText('En épreuve')
  await expect(card).toContainText('La galerie des portraits')
  await expect(board.getByRole('article', { name: 'Zombies' })).toContainText('Aucune nouvelle')
  const overflow = await board.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  // `.board` hides horizontal overflow, so check each button of the confirmation fits the phone, on one line.
  await board.getByRole('button', { name: 'Nouvelle soirée' }).click()
  for (const name of ['Effacer le tableau', 'Annuler']) {
    const box = (await board.getByRole('button', { name }).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(360)
    expect(box.height).toBeLessThanOrEqual(72)
  }
})

test('the board goes back to the code form when the evening code is refused', async ({ page }) => {
  await page.route(`${RPC}read_board`, (route) => reply(route, 403, { code: '28P01', message: 'invalid evening code' }))
  await page.goto('./?animateur')
  await page.getByLabel('Code de soirée').fill('MAUVAIS-CODE')
  await page.getByRole('button', { name: 'Ouvrir le tableau' }).click()
  await expect(page.getByRole('alert')).toHaveText('Code refusé.')
})

test('a tablet without network plays on and tells the animator', async ({ page }) => {
  await page.route(`${RPC}push_team_state`, (route) => route.abort('internetdisconnected'))
  await page.goto('./')
  await typeAnswer(page, '2710')
  await page.getByLabel('Code de soirée (facultatif)').fill('CITROUILLE-42')
  await page.getByRole('button', { name: 'Sorcières', exact: true }).click()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La galerie des portraits' })).toBeVisible()
  await typeAnswer(page, '6')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 6')
})
