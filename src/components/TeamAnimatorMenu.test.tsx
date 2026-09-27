/** @file Integration tests: an animator opens the menu from the reset icon and helps the group on screen. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { playPinSound } from '../services/sound'
import { RESET_HOLD_MS } from './ResetButton'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 60, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0, hint: 'Sous le lit' },
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
  })
  it('ends a block, and shows the hint before its time', () => {
    startZombies()
    type('9')
    expect(screen.getByRole('button', { name: 'Indice dans 10:00' })).toBeDisabled()
    openMenu()
    press('Débloquer la saisie')
    expect(screen.getByRole('button', { name: '0' })).toBeEnabled()
    openMenu()
    press('Montrer l’indice')
    expect(screen.getByRole('button', { name: 'Voir l’indice' })).toBeEnabled()
  })
  it('has no action but the answers on the home screen', () => {
    render(<TeamGame config={config} teamIndex={1} onChangeTeam={vi.fn()} />)
    openMenu()
    expect(screen.getByText('Rien à débloquer sur cet écran.')).toBeInTheDocument()
    press('Voir les solutions')
    expect(screen.getByText('Code du cadenas : 0 4')).toBeInTheDocument()
  })
})
