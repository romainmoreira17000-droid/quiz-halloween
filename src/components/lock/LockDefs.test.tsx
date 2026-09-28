/** @file Tests for the shared padlock paint (bronze Halloween gradients). */
import { render } from '@testing-library/react'
import { LockDefs } from './LockDefs'

describe('LockDefs', () => {
  it('has no rust nor blood left', () => {
    const { container } = render(<svg><LockDefs /></svg>)
    const ids = [...container.querySelectorAll('defs [id]')].map((node) => node.id)
    for (const id of ['lock-iron', 'lock-rust', 'lock-rust-grain', 'lock-blood']) expect(ids).not.toContain(id)
  })
  it('defines the bronze Halloween paint, all with lock-* ids', () => {
    const { container } = render(<svg><LockDefs /></svg>)
    const ids = [...container.querySelectorAll('defs [id]')].map((node) => node.id)
    expect(ids).toEqual(expect.arrayContaining([
      'lock-bronze', 'lock-bronze-edge', 'lock-bone', 'lock-sky', 'lock-pumpkin', 'lock-moon-glow', 'lock-glow', 'lock-pin',
    ]))
    expect(ids.every((id) => id.startsWith('lock-'))).toBe(true)
  })
})
