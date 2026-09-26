/** @file Tests for the victory screen. */
import { render, screen } from '@testing-library/react'
import { VictoryScreen } from './VictoryScreen'

describe('VictoryScreen', () => {
  it('shows the configured message and sends the group to the restaurant door', () => {
    render(<VictoryScreen header={<header>entête</header>} message="La salle est ouverte !" />)
    expect(screen.getByRole('heading', { name: 'La salle est ouverte !' })).toBeInTheDocument()
    expect(screen.getByText('Rendez-vous à la porte du restaurant !')).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
  })
  it('falls back to a neutral message', () => {
    render(<VictoryScreen header={null} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
  })
})
