/** @file Tests for the bronze body shared by the SVG padlocks. */
import { render } from '@testing-library/react'
import { HalloweenLockBody, LOCK_BODY_PATH } from './HalloweenLockBody'

describe('HalloweenLockBody', () => {
  it('draws a thick bronze body with webs, bones, banner, night window, keyhole and skull', () => {
    const { container } = render(<svg><HalloweenLockBody /></svg>)
    const body = container.querySelector('g.lock-body')
    const outlines = [...(body?.querySelectorAll(`path[d="${LOCK_BODY_PATH}"]`) ?? [])]
    expect(outlines.map((p) => p.getAttribute('fill'))).toEqual(['url(#lock-bronze-edge)', 'url(#lock-bronze)'])
    expect(body?.querySelectorAll('.lock-cobweb')).toHaveLength(2)
    expect(body?.querySelectorAll('.lock-bone')).toHaveLength(2)
    expect(body?.querySelector('.lock-banner')).toHaveTextContent('HAPPY HALLOWEEN')
    expect(body?.querySelector('.lock-night .lock-window-rim')).not.toBeNull()
    expect(body?.querySelector('.lock-keyhole')).not.toBeNull()
    expect(body?.querySelector('.lock-flare')).not.toBeNull()
    expect(body?.querySelector('.lock-skull')).not.toBeNull()
  })
  it('draws its children over the sky, under the keyhole', () => {
    const { container } = render(<svg><HalloweenLockBody><rect className="pins" /></HalloweenLockBody></svg>)
    const order = [...container.querySelectorAll('.lock-night, .pins, .lock-keyhole')].map((n) => n.getAttribute('class'))
    expect(order).toEqual(['lock-night', 'pins', 'lock-keyhole'])
  })
})
