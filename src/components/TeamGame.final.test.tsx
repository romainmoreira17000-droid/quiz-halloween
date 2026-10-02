/** @file Integration tests of the common final: everyone plays it in the last slot, then the « Bravo ! » and the padlock. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { CELEBRATION_DELAY_MS, CELEBRATION_MS } from '../hooks/useCelebration'
import { RESET_HOLD_MS } from './ResetButton'
import { arriveIfAsked } from '../test/arrive'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const MIN = 60_000
// La crypte rotates (both teams share its post); Le grenier is the final.
const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0, hints: ['Sous la poutre'] },
  ],
  finalStep: 1,
  padlock: { order: [2, 1] },
}
// Every tap and wait lands in the room at once: the way there is tested in TeamGame.travel.test.tsx.
const press = (name: string) => { fireEvent.click(screen.getByRole('button', { name })); arriveIfAsked() }
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
const wait = (ms: number) => { act(() => vi.advanceTimersByTime(ms)); arriveIfAsked() }
/** Long press on ↺, « Menu animateur », animator code typed in the window (the step screen has its own keypad). */
const openMenu = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  wait(RESET_HOLD_MS)
  press('Menu animateur')
  const dialog = within(screen.getByRole('dialog'))
  for (const key of ['2', '7', '1', '0', 'Valider']) fireEvent.click(dialog.getByRole('button', { name: key }))
}
/** La crypte (the waiting screen announces the final), then the final. */
const reachFinal = (teamIndex: number) => {
  render(<TeamGame config={config} teamIndex={teamIndex} onChangeTeam={vi.fn()} />)
  press('Commencer')
  expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
  type('4')
  expect(screen.getByText(/^L’épreuve finale dans/)).toBeInTheDocument()
  wait(15 * MIN)
  expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
}
const padlockShown = () => screen.queryByRole('list', { name: 'Chiffres trouvés' })

describe('TeamGame with a common final', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it.each([0, 1])('team %i plays the final last, then celebrates before the padlock', (team) => {
    reachFinal(team)
    type('0')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
    expect(screen.queryByText(/dans \d\d:\d\d/)).not.toBeInTheDocument()
    expect(padlockShown()).not.toBeInTheDocument()
    wait(CELEBRATION_DELAY_MS)
    expect(screen.getByRole('dialog', { name: 'Bravo !' })).toHaveTextContent('0')
    wait(CELEBRATION_MS)
    expect(padlockShown()).toBeInTheDocument()
    // The padlock has no time limit: no slot clock running down while the children turn the dials.
    expect(screen.queryByRole('timer', { name: 'Temps restant pour l’épreuve' })).not.toBeInTheDocument()
  })
  it('unlocks the hints of the final with the clock, like the other challenges', () => {
    reachFinal(0)
    expect(screen.queryByRole('button', { name: /Voir l’indice/ })).not.toBeInTheDocument()
    wait(10 * MIN)
    press('Voir l’indice')
    expect(screen.getByRole('dialog')).toHaveTextContent('Sous la poutre')
  })
  it('opens the padlock at once when the « Bravo ! » is tapped', () => {
    reachFinal(0)
    type('0')
    wait(CELEBRATION_DELAY_MS)
    fireEvent.click(screen.getByRole('dialog', { name: 'Bravo !' }))
    expect(padlockShown()).toBeInTheDocument()
  })
  it('celebrates a final solved by an animator too', () => {
    reachFinal(0)
    openMenu()
    press('Valider l’épreuve « Le grenier »')
    wait(CELEBRATION_DELAY_MS)
    expect(screen.getByRole('dialog', { name: 'Bravo !' })).toBeInTheDocument()
    wait(CELEBRATION_MS)
    expect(padlockShown()).toBeInTheDocument()
  })
  it('goes straight to the padlock when an animator skips the final', () => {
    reachFinal(0)
    openMenu()
    press('Passer au cadenas')
    press('Oui, passer au cadenas')
    expect(padlockShown()).toBeInTheDocument()
    wait(CELEBRATION_DELAY_MS)
    expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
  })
})
