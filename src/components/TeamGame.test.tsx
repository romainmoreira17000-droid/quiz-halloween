/** @file Integration tests: one team's evening, from home to the victory, driven by the clock. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { playPinSound, playVictorySound } from '../services/sound'
import { RESET_HOLD_MS } from './ResetButton'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const MIN = 60_000
const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
/** Moves the clock on; the ticking hook then shows the matching screen. */
const wait = (minutes: number) => act(() => vi.advanceTimersByTime(minutes * MIN))
const holdResetIcon = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
}
// The Zombies (team 1) play Le grenier first, then La crypte.
const renderZombies = (overrides: Partial<QuizConfig> = {}, onChangeTeam = vi.fn()) =>
  render(<TeamGame config={{ ...config, ...overrides }} teamIndex={1} onChangeTeam={onChangeTeam} />)

describe('TeamGame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('shows the team at home, then starts on its own challenge with both clocks', () => {
    renderZombies()
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
    press('Commencer')
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve 1/2')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('30:00')
  })
  it('waits for the next room once the digit is found, then moves on by itself', () => {
    renderZombies()
    press('Commencer')
    type('0')
    expect(playPinSound).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
    expect(screen.getByText('Changement de salle dans 15:00')).toBeInTheDocument()
    wait(15)
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve 2/2')).toBeInTheDocument()
  })
  it('calls an animator when time ran out, who gives the digit; the group goes on', () => {
    renderZombies()
    press('Commencer')
    type('9')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playPinSound).not.toHaveBeenCalled()
    wait(15)
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
    type('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
    type('2710')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre de l’épreuve : 0')
    press('Continuer')
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    // The wrong try of the first slot does not follow the group.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('opens the padlock after the last slot and sends the group to the restaurant door', () => {
    renderZombies()
    press('Commencer')
    type('0')
    wait(15)
    type('4')
    wait(15)
    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    press('Ouvrir')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playVictorySound).not.toHaveBeenCalled()
    // Code: digit of Le grenier (0), then of La crypte (4).
    for (let i = 0; i < 4; i++) press('Chiffre 2 : augmenter')
    press('Ouvrir')
    expect(playVictorySound).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText('Rendez-vous à la porte du restaurant !')).toBeInTheDocument()
  })
  it('restarts a game under way only with the animator code, on the home screen of the same team', () => {
    renderZombies()
    press('Commencer')
    holdResetIcon()
    press('Recommencer')
    // A restart moves the team's slots for the rest of the evening: a child alone must not be able to do it.
    const dialog = within(screen.getByRole('dialog'))
    for (const key of ['2', '7', '1', '0', 'Valider']) fireEvent.click(dialog.getByRole('button', { name: key }))
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('lets an animator change the team from the reset window', () => {
    const onChangeTeam = vi.fn()
    renderZombies({}, onChangeTeam)
    holdResetIcon()
    press('Changer d’équipe')
    expect(onChangeTeam).toHaveBeenCalledOnce()
  })
  it('shows the great hall behind the game, not on the home screen', () => {
    const { container } = renderZombies()
    expect(container.querySelector('.hall-backdrop')).toBeNull()
    press('Commencer')
    expect(container.querySelector('.hall-backdrop')).not.toBeNull()
  })
  it('shows the entrance message in front of the restaurant, and starts the clocks on its answer', () => {
    const { container } = renderZombies({ entrance: { message: 'Qui suis-je ?', answer: { kind: 'letters', value: 'Bouh' } } })
    press('Commencer')
    expect(screen.getByText('Qui suis-je ?')).toBeInTheDocument()
    expect(container.querySelector('.restaurant-front')).not.toBeNull()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    wait(5) // the clocks wait for the group to be inside
    for (const key of ['B', 'O', 'U', 'H']) press(key)
    press('Valider')
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
  })
})
