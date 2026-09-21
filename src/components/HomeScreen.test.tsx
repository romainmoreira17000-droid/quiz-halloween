/** @file Tests for the home screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('shows title, intro and duration', () => {
    render(<HomeScreen title="Le manoir hanté" intro="Bienvenue !" durationMinutes={90} onStart={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Le manoir hanté' })).toBeInTheDocument()
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument()
    expect(screen.getByText('Vous avez 90 minutes.')).toBeInTheDocument()
  })
  it('works without intro', () => {
    render(<HomeScreen title="T" durationMinutes={1} onStart={() => {}} />)
    expect(screen.getByText('Vous avez 1 minute.')).toBeInTheDocument()
  })
  it('starts the game', async () => {
    const onStart = vi.fn()
    render(<HomeScreen title="T" durationMinutes={90} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
