/** @file Tests for the chains crossed over a padlock. */
import { render } from '@testing-library/react'
import { LockChains } from './LockChains'

const BOX = { x: 0, y: 100, width: 300, height: 150 }

describe('LockChains', () => {
  it('crosses two chains of links over the box, as decoration', () => {
    const { container } = render(<svg><LockChains box={BOX} /></svg>)
    const group = container.querySelector('g.lock-chains')
    expect(group).toHaveAttribute('aria-hidden', 'true')
    const chains = container.querySelectorAll('.lock-chain')
    expect(chains).toHaveLength(2)
    for (const chain of chains) expect(chain.querySelectorAll('.lock-chain-link').length).toBeGreaterThan(4)
    expect(group).not.toHaveClass('lock-chains--fallen')
  })
  it('lets the chains fall once the lock opens', () => {
    const { container } = render(<svg><LockChains box={BOX} fallen /></svg>)
    expect(container.querySelector('g.lock-chains')).toHaveClass('lock-chains--fallen')
  })
  it('keeps every link inside the box', () => {
    const { container } = render(<svg><LockChains box={BOX} /></svg>)
    for (const link of container.querySelectorAll('.lock-chain-link')) {
      const cx = Number(link.getAttribute('cx'))
      const cy = Number(link.getAttribute('cy'))
      expect(cx).toBeGreaterThanOrEqual(BOX.x)
      expect(cx).toBeLessThanOrEqual(BOX.x + BOX.width)
      expect(cy).toBeGreaterThanOrEqual(BOX.y)
      expect(cy).toBeLessThanOrEqual(BOX.y + BOX.height)
    }
  })
})
