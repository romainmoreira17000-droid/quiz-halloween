/** @file Tests for the rusty frame of the final padlock. */
import { render, screen } from '@testing-library/react'
import { FinalLock } from './FinalLock'

describe('FinalLock', () => {
  it('wraps the dials in a rusty body under a chained shackle, drawn as decoration', () => {
    const { container } = render(<FinalLock><button type="button">molette</button></FinalLock>)
    expect(container.querySelector('.final-lock-body')).toContainElement(screen.getByRole('button', { name: 'molette' }))
    const art = container.querySelectorAll('svg')
    expect(art.length).toBeGreaterThan(0)
    for (const svg of art) expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.final-lock-shackle .lock-chains')).not.toBeNull()
    expect(container.querySelectorAll('.blood-drip').length).toBeGreaterThan(0)
  })
})
