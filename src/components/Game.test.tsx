/** @file Integration test: a full game in memory. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Game } from './Game'
import type { QuizConfig } from '../config/types'
import { playVictorySound } from '../services/sound'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn() }))

const config: QuizConfig = {
  title: 'Le manoir hanté', durationMinutes: 90, stepCount: 2,
  steps: [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }],
  padlock: { order: [2, 1] },
}

describe('Game', () => {
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
})
