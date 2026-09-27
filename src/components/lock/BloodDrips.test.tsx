/** @file Tests for the blood running down a padlock. */
import { render } from '@testing-library/react'
import { BloodDrips } from './BloodDrips'

const DRIPS = [{ x: 150, y: 170, length: 30 }, { x: 60, y: 110, length: 18 }]

describe('BloodDrips', () => {
  it('draws one drip per entry and a single drop beading under the first one', () => {
    const { container } = render(<svg><BloodDrips drips={DRIPS} /></svg>)
    expect(container.querySelector('g.blood-drips')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.blood-drip')).toHaveLength(2)
    const drops = container.querySelectorAll('.blood-drop')
    expect(drops).toHaveLength(1)
    expect(drops[0]).toHaveAttribute('cx', '150')
    expect(Number(drops[0].getAttribute('cy'))).toBeGreaterThanOrEqual(170 + 30)
  })
  it('draws nothing without drips', () => {
    const { container } = render(<svg><BloodDrips drips={[]} /></svg>)
    expect(container.querySelector('.blood-drop')).toBeNull()
  })
})
