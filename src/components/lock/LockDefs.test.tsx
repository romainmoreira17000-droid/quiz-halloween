/** @file Tests for the shared padlock paint (gradients, rust filter, blood). */
import { render } from '@testing-library/react'
import { LockDefs } from './LockDefs'

describe('LockDefs', () => {
  it('defines the rusty iron, the rust grain and the blood, all with lock-* ids', () => {
    const { container } = render(<svg><LockDefs /></svg>)
    const ids = [...container.querySelectorAll('defs [id]')].map((node) => node.id)
    expect(ids).toEqual(expect.arrayContaining(['lock-iron', 'lock-rust', 'lock-rust-grain', 'lock-blood', 'lock-chain']))
    expect(ids.every((id) => id.startsWith('lock-'))).toBe(true)
    expect(container.querySelector('filter#lock-rust-grain feTurbulence')).not.toBeNull()
  })
})
