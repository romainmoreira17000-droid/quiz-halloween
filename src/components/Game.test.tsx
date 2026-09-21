/** @file Integration test: a full game in memory. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Game } from './Game'
import type { QuizConfig } from '../config/types'

const config: QuizConfig = {
  title: 'Le manoir hanté', durationMinutes: 90, stepCount: 2,
  steps: [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }],
  padlock: { order: [1, 2] },
}

describe('Game', () => {
  it('plays from home to the end, with a wrong answer', async () => {
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

    expect(screen.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
