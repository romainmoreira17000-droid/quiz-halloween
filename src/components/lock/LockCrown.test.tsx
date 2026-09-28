/** @file Tests for the crown of the Halloween padlocks: shackle, pumpkin, bat wings. */
import { render } from '@testing-library/react'
import { LockCrown, LockShackle } from './LockCrown'

describe('LockShackle', () => {
  it('draws a bronze shackle whose legs go down to the body, with the class given', () => {
    const { container } = render(<svg><LockShackle className="cutaway-shackle" /></svg>)
    const paths = container.querySelectorAll('g.cutaway-shackle path')
    expect(paths[0]).toHaveAttribute('d', 'M100 104 V66 a50 50 0 0 1 100 0 V104')
    expect(paths[1]).toHaveAttribute('stroke', 'url(#lock-bronze)')
  })
  it('can have long legs, kept inside the body once it springs up', () => {
    const { container } = render(<svg><LockShackle className="victory-lock-shackle" legBottom={140} /></svg>)
    expect(container.querySelector('g.victory-lock-shackle path')).toHaveAttribute('d', 'M100 140 V66 a50 50 0 0 1 100 0 V140')
  })
})

describe('LockCrown', () => {
  it('has two bat wings, a flare and a lit pumpkin face with two eyes', () => {
    const { container } = render(<svg><LockCrown /></svg>)
    const crown = container.querySelector('g.lock-crown')
    expect(crown?.querySelectorAll('.lock-wing')).toHaveLength(2)
    expect(crown?.querySelector('.lock-flare')).not.toBeNull()
    expect(crown?.querySelectorAll('.lock-pumpkin-face .lock-eye.lock-eye--pumpkin')).toHaveLength(2)
  })
})
