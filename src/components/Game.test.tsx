/** @file Integration tests: a full game, and the animator's reset. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Game } from './Game'
import { RESET_HOLD_MS } from './ResetButton'
import type { QuizConfig } from '../config/types'
import { playVictorySound } from '../services/sound'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn() }))

const config: QuizConfig = {
  title: 'Le manoir hanté', durationMinutes: 90, stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}

describe('Game', () => {
  afterEach(() => vi.useRealTimers())

  it('plays from home to the victory, with a wrong answer and a wrong code', async () => {
    const user = userEvent.setup()
    render(<Game config={config} />)
    await user.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('90:00')
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4' }))
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 4')
    await user.click(screen.getByRole('button', { name: 'Étape suivante' }))

    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playVictorySound).not.toHaveBeenCalled()

    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Chiffre 2 : augmenter' }))
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(playVictorySound).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText(/^Temps : \d+ min \d{2} s$/)).toBeInTheDocument()
  })

  it('shows the reset icon on every screen and restarts after a long press + confirmation', () => {
    vi.useFakeTimers()
    render(<Game config={config} />)
    const icon = () => screen.getByRole('button', { name: 'Recommencer la partie (appui long)' })
    expect(icon()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    fireEvent.pointerDown(icon())
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument()
  })
})
