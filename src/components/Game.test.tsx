/** @file Tests for the tablet entry: team setup first, then the team's game. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { TEAM_KEY } from '../services/savedTeam'
import { Game } from './Game'
import { RESET_HOLD_MS } from './ResetButton'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [1, 2] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('Game', () => {
  afterEach(() => vi.useRealTimers())

  it('asks an animator to set up the team, then shows its home screen', () => {
    render(<Game config={config} />)
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
    for (const digit of '2710') press(digit)
    press('Valider')
    press('Zombies')
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('goes straight to the home screen once the tablet has a team', () => {
    localStorage.setItem(TEAM_KEY, 'Zombies')
    render(<Game config={config} />)
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('asks for the team again after « Changer d’équipe »', () => {
    vi.useFakeTimers()
    localStorage.setItem(TEAM_KEY, 'Zombies')
    render(<Game config={config} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    press('Changer d’équipe')
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
  })
})
