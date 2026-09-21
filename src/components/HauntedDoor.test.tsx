/** @file Tests for the decorative victory animation markup. */
import { render } from '@testing-library/react'
import { HauntedDoor } from './HauntedDoor'

describe('HauntedDoor', () => {
  it('is hidden from screen readers and has two doors, a lock, ghosts and bats', () => {
    const { container } = render(<HauntedDoor />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.door')).toHaveLength(2)
    expect(container.querySelector('.lock')).not.toBeNull()
    expect(container.querySelectorAll('.ghost')).toHaveLength(3)
    expect(container.querySelectorAll('.bat')).toHaveLength(4)
  })
})
