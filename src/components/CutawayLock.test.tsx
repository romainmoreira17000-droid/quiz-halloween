/** @file Tests for the cutaway padlock. */
import { render, screen } from '@testing-library/react'
import { CutawayLock } from './CutawayLock'

describe('CutawayLock', () => {
  it('draws one pin per step, none down at the start', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[]} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 0 goupille tombée sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin')).toHaveLength(6)
    expect(container.querySelectorAll('.lock-pin--down')).toHaveLength(0)
    expect(container.querySelector('.cutaway-lock--open')).toBeNull()
  })
  it('drops the pins of the found digits and writes the digits under them', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[4, 7, 0]} fallingIndex={2} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 3 goupilles tombées sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin--down')).toHaveLength(3)
    expect(container.querySelectorAll('.lock-pin--falling')).toHaveLength(1)
    expect(container.querySelectorAll('.lock-pin')[2]).toHaveClass('lock-pin--falling')
    expect([...container.querySelectorAll('.lock-digit')].map((t) => t.textContent)).toEqual(['4', '7', '0', '·', '·', '·'])
  })
  it('uses the singular for one pin', () => {
    render(<CutawayLock total={6} foundDigits={[4]} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 1 goupille tombée sur 6' })).toBeInTheDocument()
  })
  it('releases the shackle once every pin is down', () => {
    const { container } = render(<CutawayLock total={2} foundDigits={[1, 2]} />)
    expect(screen.getByRole('img', { name: 'Cadenas ouvert : toutes les goupilles sont tombées' })).toBeInTheDocument()
    expect(container.querySelector('.cutaway-lock--open')).not.toBeNull()
  })
  it('keeps every pin inside the lock chamber, even with many steps', () => {
    const { container } = render(<CutawayLock total={12} foundDigits={[]} />)
    const pins = [...container.querySelectorAll('.lock-pin')]
    for (const pin of pins) {
      const x = Number(pin.getAttribute('x'))
      const width = Number(pin.getAttribute('width'))
      expect(width).toBeGreaterThan(0)
      expect(x).toBeGreaterThanOrEqual(44)
      expect(x + width).toBeLessThanOrEqual(256)
    }
  })
  it('drops the pins of the challenges found, in any order', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[null, 7, null, null, 2, null]} fallingIndex={4} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })).toBeInTheDocument()
    const pins = [...container.querySelectorAll('.lock-pin')].map((pin) => pin.getAttribute('class'))
    expect(pins).toEqual([
      'lock-pin', 'lock-pin lock-pin--down', 'lock-pin', 'lock-pin',
      'lock-pin lock-pin--down lock-pin--falling', 'lock-pin',
    ])
    expect([...container.querySelectorAll('.lock-digit')].map((d) => d.textContent)).toEqual(['·', '7', '·', '·', '2', '·'])
  })
})
