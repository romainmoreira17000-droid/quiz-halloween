/** @file Tests for the bronze padlock the victory screen plunges into. */
import { render } from '@testing-library/react'
import { LOCK_BODY_PATH } from './HalloweenLockBody'
import { VictoryLock } from './VictoryLock'

describe('VictoryLock', () => {
  it('draws a bronze lock with a thickness behind it, whose shackle springs and chains fall, as decoration', () => {
    const { container } = render(<VictoryLock />)
    const root = container.querySelector('.victory-lock-3d')
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root?.querySelector('svg.victory-lock-back path')).toHaveAttribute('d', LOCK_BODY_PATH)
    const svg = root?.querySelector('svg.victory-lock')
    expect(svg?.querySelector('#lock-bronze')).not.toBeNull()
    expect(svg?.querySelector('.victory-lock-shackle')).not.toBeNull()
    expect(svg?.querySelector('.lock-chains--fallen')).not.toBeNull()
    expect(svg?.querySelector('.lock-night')).not.toBeNull()
    expect(svg?.querySelector('.lock-hanging-ghost')).not.toBeNull()
    expect(svg?.querySelector('.blood-drip')).toBeNull()
  })
})
