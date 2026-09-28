/** @file Tests for the glowing banner of the padlock. */
import { render } from '@testing-library/react'
import { LockBanner } from './LockBanner'

describe('LockBanner', () => {
  it('writes HAPPY HALLOWEEN along an arc', () => {
    const { container } = render(<svg><LockBanner y={116} /></svg>)
    expect(container.querySelector('path#lock-banner-arc')).toHaveAttribute('d', 'M70 124 Q150 102 230 124')
    const text = container.querySelector('text.lock-banner-text textPath')
    expect(text).toHaveTextContent('HAPPY HALLOWEEN')
    expect(text).toHaveAttribute('href', '#lock-banner-arc')
  })
})
