/** @file Integration tests: an animator opens the menu from the reset icon and helps the group on screen. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { playPinSound } from '../services/sound'
import { RESET_HOLD_MS } from './ResetButton'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10, 12], blockSeconds: 60, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0, hints: ['Sous le lit', 'Sous l’oreiller'] },
  ],
  padlock: { order: [2, 1] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
/** Long press on ↺, « Menu animateur », animator code. */
const openMenu = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
  press('Menu animateur')
  // The step screen has its own keypad: type the code in the window.
  const dialog = within(screen.getByRole('dialog'))
  for (const key of ['2', '7', '1', '0', 'Valider']) fireEvent.click(dialog.getByRole('button', { name: key }))
}
// The Zombies (team 1) play Le grenier first.
const startZombies = () => {
  render(<TeamGame config={config} teamIndex={1} onChangeTeam={vi.fn()} />)
  press('Commencer')
}

describe('animator menu in the game', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('solves the challenge on screen, with the clack', () => {
    startZombies()
    openMenu()
    press('Valider l’épreuve « Le grenier »')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
    expect(playPinSound).toHaveBeenCalledOnce()
    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByRole('dialog', { name: 'Bravo !' })).toBeInTheDocument()
  })
  it('ends a block, and gives the hints one by one before their time', () => {
    startZombies()
    type('9')
    expect(screen.getByRole('button', { name: 'Indice dans 10:00' })).toBeDisabled()
    openMenu()
    press('Débloquer la saisie')
    expect(screen.getByRole('button', { name: '0' })).toBeEnabled()
    openMenu()
    press('Débloquer l’indice suivant (1/2)')
    expect(screen.getByRole('button', { name: 'Voir l’indice (1/2)' })).toBeEnabled()
    openMenu()
    press('Débloquer l’indice suivant (2/2)')
    expect(screen.getByRole('button', { name: 'Voir les indices (2/2)' })).toBeEnabled()
    openMenu()
    expect(screen.queryByRole('button', { name: /Débloquer l’indice/ })).not.toBeInTheDocument()
  })
  it('moves on to the next challenge, giving the digit of the unsolved one', () => {
    startZombies()
    openMenu()
    press('Passer à l’épreuve suivante')
    press('Oui, passer à l’épreuve suivante')
    expect(playPinSound).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    // From the wait too: no clack, the digit is already found.
    type('4')
    act(() => vi.advanceTimersByTime(4000)) // let « Bravo ! » close
    vi.clearAllMocks()
    openMenu()
    press('Passer à l’épreuve suivante')
    press('Oui, passer à l’épreuve suivante')
    expect(playPinSound).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: /cadenas/i })).toBeInTheDocument()
  })
  it('lines the tablet up with an earlier start time, in the room of that slot', () => {
    vi.setSystemTime(new Date(2026, 9, 31, 20, 5))
    startZombies()
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    openMenu()
    const field = screen.getByLabelText('Départ de la partie')
    expect(field).toHaveValue('20:05')
    // The other tablets started at 19:48: they are in slot 1 (La crypte for the Zombies), and Le grenier was missed.
    fireEvent.change(field, { target: { value: '19:48' } })
    press('Recaler l’heure de départ')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
  })
  it('offers the start time on « Temps écoulé », without saying there is nothing to do', () => {
    startZombies()
    act(() => vi.advanceTimersByTime(16 * 60_000))
    openMenu()
    expect(screen.getByLabelText('Départ de la partie')).toBeInTheDocument()
    expect(screen.queryByText('Rien à débloquer sur cet écran.')).not.toBeInTheDocument()
  })
  it('has no action but the answers on the home screen', () => {
    render(<TeamGame config={config} teamIndex={1} onChangeTeam={vi.fn()} />)
    openMenu()
    expect(screen.getByText('Rien à débloquer sur cet écran.')).toBeInTheDocument()
    press('Voir les solutions')
    expect(screen.getByText('Code du cadenas : 0 4')).toBeInTheDocument()
  })
})
