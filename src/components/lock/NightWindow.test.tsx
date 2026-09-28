/** @file Tests for the night sky seen through the padlock window. */
import { render } from '@testing-library/react'
import { NightWindow } from './NightWindow'

const BOX = { x: 48, y: 128, width: 204, height: 100 }

describe('NightWindow', () => {
  it('clips a sky with a moon, a witch and a castle to a round-cornered porthole with a rim', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="porthole" /></svg>)
    expect(container.querySelector('clipPath#lock-window-clip rect')).toHaveAttribute('rx', '30')
    const sky = container.querySelector('g[clip-path="url(#lock-window-clip)"]')
    expect(sky?.querySelector('rect')).toHaveAttribute('fill', 'url(#lock-sky)')
    expect(sky?.querySelector('.lock-moon')).not.toBeNull()
    expect(sky?.querySelector('.lock-witch')).not.toBeNull()
    expect(sky?.querySelector('.lock-castle')).not.toBeNull()
    expect(container.querySelector('.lock-window-rim')).not.toBeNull()
  })
  it('fills a plain rectangle, without rim, for the HTML window of the final lock', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="plain" /></svg>)
    expect(container.querySelector('clipPath#lock-window-clip rect')).toHaveAttribute('rx', '0')
    expect(container.querySelector('.lock-window-rim')).toBeNull()
  })
  it('puts the moon inside the window', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="porthole" /></svg>)
    const moon = container.querySelector('.lock-moon')
    const cx = Number(moon?.getAttribute('cx'))
    const cy = Number(moon?.getAttribute('cy'))
    expect(cx).toBeGreaterThan(BOX.x)
    expect(cx).toBeLessThan(BOX.x + BOX.width)
    expect(cy).toBeGreaterThan(BOX.y)
    expect(cy).toBeLessThan(BOX.y + BOX.height)
  })
})
