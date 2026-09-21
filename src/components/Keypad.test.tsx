/** @file Tests for the 0–9 keypad. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keypad } from './Keypad'

describe('Keypad', () => {
  it('shows 1 to 9 then 0', () => {
    render(<Keypad onDigit={() => {}} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
  })
  it('sends the pressed digit, including 0', async () => {
    const onDigit = vi.fn()
    render(<Keypad onDigit={onDigit} />)
    await userEvent.click(screen.getByRole('button', { name: '0' }))
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(onDigit.mock.calls).toEqual([[0], [7]])
  })
})
