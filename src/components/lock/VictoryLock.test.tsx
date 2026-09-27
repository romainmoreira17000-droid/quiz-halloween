/** @file Tests for the rusty padlock that springs open on the victory screen. */
import { render } from '@testing-library/react'
import { VictoryLock } from './VictoryLock'

describe('VictoryLock', () => {
  it('draws a rusty lock whose chains fall and whose shackle springs, as decoration', () => {
    const { container } = render(<VictoryLock />)
    const svg = container.querySelector('svg.victory-lock')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.querySelector('#lock-rust')).not.toBeNull()
    expect(svg?.querySelector('.victory-lock-shackle')).not.toBeNull()
    expect(svg?.querySelector('.lock-chains--fallen')).not.toBeNull()
    expect(svg?.querySelectorAll('.blood-drip').length).toBeGreaterThan(0)
  })
})
