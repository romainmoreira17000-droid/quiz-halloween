/** @file Tests for the home screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('shows the team, title, intro and the rhythm of the evening', () => {
    render(<HomeScreen title="Le manoir hanté" intro="Bienvenue !" teamName="Momies" challengeCount={6} slotMinutes={15} onStart={() => {}} />)
    expect(screen.getByText('Équipe des Momies')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Le manoir hanté' })).toBeInTheDocument()
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument()
    expect(screen.getByText('6 épreuves de 15 minutes.')).toBeInTheDocument()
  })
  it('works without intro, in the singular', () => {
    render(<HomeScreen title="T" teamName="Momies" challengeCount={1} slotMinutes={1} onStart={() => {}} />)
    expect(screen.getByText('1 épreuve de 1 minute.')).toBeInTheDocument()
  })
  it('starts the game', async () => {
    const onStart = vi.fn()
    render(<HomeScreen title="T" teamName="Momies" challengeCount={6} slotMinutes={15} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
