/** @file Tests for the victory screen. */
import { render, screen } from '@testing-library/react'
import { VictoryScreen } from './VictoryScreen'

describe('VictoryScreen', () => {
  it('shows the configured message and the time taken', () => {
    render(<VictoryScreen header={<header>entête</header>} message="La salle est ouverte !" elapsedSeconds={2535} />)
    expect(screen.getByRole('heading', { name: 'La salle est ouverte !' })).toBeInTheDocument()
    expect(screen.getByText('Temps : 42 min 15 s')).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
  })
  it('falls back to a neutral message', () => {
    render(<VictoryScreen header={null} elapsedSeconds={3903} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText('Temps : 1 h 05 min 03 s')).toBeInTheDocument()
  })
})
