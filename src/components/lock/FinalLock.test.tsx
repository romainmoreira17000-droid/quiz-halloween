/** @file Tests for the bronze frame of the final padlock. */
import { render, screen } from '@testing-library/react'
import { FinalLock } from './FinalLock'

describe('FinalLock', () => {
  it('puts the dials in a night window of a bronze body under a chained crown, all drawn as decoration', () => {
    const { container } = render(<FinalLock><button type="button">molette</button></FinalLock>)
    expect(container.querySelector('.final-lock-window')).toContainElement(screen.getByRole('button', { name: 'molette' }))
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.final-lock-crown .lock-chains')).not.toBeNull()
    expect(container.querySelector('.final-lock-crown .lock-pumpkin-face')).not.toBeNull()
    expect(container.querySelector('.final-lock-sky .lock-night')).not.toBeNull()
    expect(container.querySelector('.final-lock-banner')).toHaveTextContent('HAPPY HALLOWEEN')
    expect(container.querySelector('.final-lock-banner')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.lock-skull')).not.toBeNull()
    expect(container.querySelector('.blood-drip')).toBeNull()
  })
  it('is calm by default and alarmed on demand', () => {
    const { container, rerender } = render(<FinalLock><i /></FinalLock>)
    expect(container.querySelector('.final-lock--alarmed')).toBeNull()
    rerender(<FinalLock alarmed><i /></FinalLock>)
    expect(container.querySelector('.final-lock')).toHaveClass('final-lock--alarmed')
  })
})
