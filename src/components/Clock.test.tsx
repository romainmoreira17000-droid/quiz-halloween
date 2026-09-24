/** @file Tests for the countdown display. */
import { render, screen } from '@testing-library/react'
import { Clock } from './Clock'

describe('Clock', () => {
  it('shows the time left in amber', () => {
    render(<Clock seconds={5057} label="Temps restant" />)
    expect(screen.getByRole('timer')).toHaveTextContent('84:17')
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('is not red at exactly zero', () => {
    render(<Clock seconds={0} label="Temps restant" />)
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('turns red and negative once time is up', () => {
    render(<Clock seconds={-125} label="Temps restant" />)
    expect(screen.getByRole('timer')).toHaveTextContent('-02:05')
    expect(screen.getByRole('timer')).toHaveClass('clock--overtime')
  })
  it('is named after what it counts', () => {
    render(<Clock seconds={60} label="Temps total restant" />)
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('01:00')
  })
})
