/** @file Tests for the great hall backdrop. */
import { render } from '@testing-library/react'
import { HallBackdrop } from './HallBackdrop'

describe('HallBackdrop', () => {
  it('draws the hall as pure decoration, with candles and a ghost', () => {
    const { container } = render(<HallBackdrop />)
    const svg = container.querySelector('svg.hall-backdrop')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.querySelectorAll('.hall-flame').length).toBeGreaterThanOrEqual(5)
    expect(svg?.querySelector('.hall-ghost')).not.toBeNull()
  })
})
