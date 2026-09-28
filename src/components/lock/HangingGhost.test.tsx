/** @file Tests for the little ghost hanging from the padlock chain. */
import { render } from '@testing-library/react'
import { HangingGhost } from './HangingGhost'

describe('HangingGhost', () => {
  it('hangs at the given point, with a group to jolt and a group that swings', () => {
    const { container } = render(<svg><HangingGhost x={252} y={66} /></svg>)
    const anchor = container.querySelector('g[transform="translate(252 66)"]')
    expect(anchor?.querySelector('.lock-hanging-ghost .lock-ghost-swing line')).toHaveAttribute('y1', '-16')
    expect(anchor?.querySelectorAll('.lock-ghost-swing circle')).toHaveLength(2)
  })
})
