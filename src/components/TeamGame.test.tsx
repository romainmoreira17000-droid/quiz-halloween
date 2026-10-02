/** @file Integration tests: one team's evening, from home to the victory, driven by the clock. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { playPinSound, playVictorySound } from '../services/sound'
import { RESET_HOLD_MS } from './ResetButton'
import { arriveIfAsked } from '../test/arrive'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const MIN = 60_000
const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
// Every tap and wait lands in the room at once: the way there is tested in TeamGame.travel.test.tsx.
const press = (name: string) => { fireEvent.click(screen.getByRole('button', { name })); arriveIfAsked() }
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
/** Moves the clock on; the ticking hook then shows the matching screen. */
const wait = (minutes: number) => { act(() => vi.advanceTimersByTime(minutes * MIN)); arriveIfAsked() }
const holdResetIcon = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
}
// The Zombies (team 1) play Le grenier first, then La crypte.
const renderZombies = (overrides: Partial<QuizConfig> = {}, onChangeTeam = vi.fn(), testMode = false) =>
  render(<TeamGame config={{ ...config, ...overrides }} teamIndex={1} onChangeTeam={onChangeTeam} testMode={testMode} />)

describe('TeamGame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('in test mode, skips to the next challenge; a skipped challenge is time up', () => {
    renderZombies({}, vi.fn(), true)
    expect(screen.getByText('Mode test')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Épreuve suivante' })).not.toBeInTheDocument() // home
    press('Commencer')
    type('0')
    press('Épreuve suivante')
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    press('Épreuve suivante')
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Épreuve suivante' })).not.toBeInTheDocument()
  })
  it('has no test mode by default', () => {
    renderZombies()
    press('Commencer')
    expect(screen.queryByText('Mode test')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Épreuve suivante' })).not.toBeInTheDocument()
  })

  it('shows the team at home, then starts on its own challenge with both clocks', () => {
    renderZombies()
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
    press('Commencer')
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve 1/2')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('30:00')
  })
  it('shows the photo of each place: home, the room, then home again while waiting', () => {
    const photo = () => document.querySelector('.backdrop--photo img')?.getAttribute('src')
    renderZombies({ homeBackdrop: 'accueil.webp', steps: [config.steps[0], { ...config.steps[1], backdrop: 'grenier.webp' }] })
    expect(photo()).toBe('/images/accueil.webp')
    press('Commencer')
    expect(photo()).toBe('/images/grenier.webp')
    type('0')
    expect(photo()).toBe('/images/accueil.webp')
  })
  it('celebrates the found digit, waits with the message, then moves on by itself', () => {
    renderZombies({ waitingMessage: 'Goûtez les bonbons !' })
    press('Commencer')
    type('0')
    expect(playPinSound).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
    expect(screen.getByText('Changement d’épreuve dans 15:00')).toBeInTheDocument()
    wait(0.03)
    expect(screen.getByRole('dialog', { name: 'Bravo !' })).toHaveTextContent('0')
    wait(0.05)
    expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
    expect(screen.getByText('Goûtez les bonbons !')).toBeInTheDocument()
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
  it('blocks the keyboard for a minute after a wrong answer, then accepts the right one', () => {
    renderZombies({ blockSeconds: 60 })
    press('Commencer')
    type('9')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 01:00')
    expect(screen.getByRole('button', { name: '0' })).toBeDisabled()
    wait(1)
    type('0')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
  })
  it('unlocks the hint ten minutes into the slot', () => {
    const steps = [config.steps[0], { ...config.steps[1], hints: ['Sous la malle.'] }]
    renderZombies({ steps })
    press('Commencer')
    expect(screen.getByRole('button', { name: 'Indice dans 10:00' })).toBeDisabled()
    wait(10)
    press('Voir l’indice')
    expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous la malle.')
  })
  it('unlocks the hints one by one at their minutes', () => {
    const steps = [config.steps[0], { ...config.steps[1], hints: ['Sous la malle.', 'Dans le grenier.'] }]
    renderZombies({ steps, hintTimes: [5, 8] })
    press('Commencer')
    wait(5)
    press('Voir l’indice (1/2)')
    expect(screen.getByRole('dialog', { name: 'Indices' })).toHaveTextContent('Indice suivant dans 03:00')
    press('Fermer')
    wait(3)
    expect(screen.getByRole('button', { name: 'Voir les indices (2/2)' })).toBeEnabled()
  })
  it('never shows more than the block time, even when the screen clock lags', () => {
    renderZombies({ blockSeconds: 60 })
    press('Commencer')
    // The screen clock ticks every 500 ms: the wrong answer lands 250 ms after the last tick.
    act(() => vi.advanceTimersByTime(250))
    type('9')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 01:00')
  })
})
