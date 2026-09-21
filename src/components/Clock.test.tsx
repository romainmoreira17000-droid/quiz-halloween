/** @file Tests for the countdown display. */
import { render, screen } from '@testing-library/react'
import { Clock } from './Clock'

describe('Clock', () => {
  it('shows the time left in amber', () => {
    render(<Clock seconds={5057} />)
    expect(screen.getByRole('timer')).toHaveTextContent('84:17')
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('is not red at exactly zero', () => {
    render(<Clock seconds={0} />)
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('turns red and negative once time is up', () => {
    render(<Clock seconds={-125} />)
    expect(screen.getByRole('timer')).toHaveTextContent('-02:05')
    expect(screen.getByRole('timer')).toHaveClass('clock--overtime')
  })
})
