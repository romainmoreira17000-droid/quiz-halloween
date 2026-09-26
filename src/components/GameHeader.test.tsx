/** @file Tests for the in-game header. */
import { render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

describe('GameHeader', () => {
  it('shows the slot, its time left in big and the total time in small', () => {
    render(<GameHeader slot={2} total={6} solved={2} slotSeconds={767} totalSeconds={3467} />)
    expect(screen.getByText('Épreuve 3/6')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('12:47')
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('57:47')
    expect(screen.getByRole('list', { name: 'Étape 3 sur 6' })).toBeInTheDocument()
  })
  it('shows only the candles once every slot is over', () => {
    render(<GameHeader slot={null} total={6} solved={6} slotSeconds={0} totalSeconds={0} />)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
