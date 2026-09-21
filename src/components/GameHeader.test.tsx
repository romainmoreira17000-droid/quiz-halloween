/** @file Tests for the in-game header. */
import { render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

describe('GameHeader', () => {
  it('shows the live clock and the candles', () => {
    render(<GameHeader startedAt={Date.now()} durationMinutes={90} total={6} solved={0} current={0} />)
    expect(screen.getByRole('timer')).toHaveTextContent('90:00')
    expect(screen.getByRole('list', { name: 'Étape 1 sur 6' })).toBeInTheDocument()
  })
  it('shows the frozen time once finished', () => {
    const start = Date.now() - 600_000
    render(<GameHeader startedAt={start} finishedAt={start + 125_000} durationMinutes={90} total={6} solved={6} current={null} />)
    expect(screen.getByRole('timer')).toHaveTextContent('87:55')
  })
})
