/** @file Integration tests: the way to each room (« Dirigez-vous vers ») and the next challenge on the waiting screen. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { RESET_HOLD_MS } from './ResetButton'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const MIN = 60_000
const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'Comptez les os.', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'Ouvrez la malle.', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
const wait = (minutes: number) => act(() => vi.advanceTimersByTime(minutes * MIN))
// The Zombies (team 1) play Le grenier first, then La crypte.
const renderZombies = () => render(<TeamGame config={config} teamIndex={1} onChangeTeam={vi.fn()} />)

describe('TeamGame, way to the rooms', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('sends the group to its first room, then shows the riddle once there', () => {
    renderZombies()
    press('Commencer')
    expect(screen.getByText('Maintenant, dirigez-vous vers :')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.queryByText('Ouvrez la malle.')).not.toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
    wait(1)
    press('Nous sommes arrivés')
    expect(screen.getByText('Ouvrez la malle.')).toBeInTheDocument()
    // The clock kept running on the way.
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('14:00')
  })
  it('does not ask again after a reload', () => {
    const { unmount } = renderZombies()
    press('Commencer')
    press('Nous sommes arrivés')
    unmount()
    renderZombies()
    expect(screen.getByText('Ouvrez la malle.')).toBeInTheDocument()
  })
  it('announces the next challenge while waiting, then sends the group there', () => {
    renderZombies()
    press('Commencer')
    press('Nous sommes arrivés')
    type('0')
    expect(screen.getByText('Prochaine épreuve :')).toBeInTheDocument()
    expect(screen.getByText('La crypte')).toBeInTheDocument()
    wait(15)
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nous sommes arrivés' })).toBeInTheDocument()
    press('Nous sommes arrivés')
    expect(screen.getByText('Comptez les os.')).toBeInTheDocument()
  })
  it('offers no riddle help from the animator menu on the way, only the skip and the start time', () => {
    renderZombies()
    press('Commencer')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    press('Menu animateur')
    const dialog = within(screen.getByRole('dialog'))
    for (const key of ['2', '7', '1', '0', 'Valider']) fireEvent.click(dialog.getByRole('button', { name: key }))
    expect(screen.queryByRole('button', { name: /^Valider l’épreuve/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /indice/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Passer à l’épreuve suivante/ })).toBeInTheDocument()
  })
  it('announces no next challenge in the last slot', () => {
    renderZombies()
    press('Commencer')
    press('Nous sommes arrivés')
    type('0')
    wait(15)
    press('Nous sommes arrivés')
    type('4')
    expect(screen.queryByText('Prochaine épreuve :')).not.toBeInTheDocument()
  })
})
