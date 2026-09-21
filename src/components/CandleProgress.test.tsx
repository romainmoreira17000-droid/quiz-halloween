/** @file Tests for the candle progress bar. */
import { render, screen } from '@testing-library/react'
import { CandleProgress } from './CandleProgress'

describe('CandleProgress', () => {
  it('lights solved steps and marks the current one', () => {
    render(<CandleProgress total={4} solved={1} current={1} />)
    const candles = screen.getAllByRole('listitem')
    expect(candles.map((li) => li.className)).toEqual(['lit', 'current', '', ''])
    expect(screen.getByRole('list', { name: 'Étape 2 sur 4' })).toBeInTheDocument()
  })
  it('lights the current candle as soon as its step is solved', () => {
    render(<CandleProgress total={2} solved={2} current={1} />)
    expect(screen.getAllByRole('listitem').map((li) => li.className)).toEqual(['lit', 'lit'])
  })
  it('announces the end when there is no current step', () => {
    render(<CandleProgress total={2} solved={2} current={null} />)
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
