/** @file Tests for the digit keypad. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keypad, type AnswerKeysProps } from './Keypad'

const props = (): AnswerKeysProps => ({ onKey: vi.fn(), onErase: vi.fn(), onSubmit: vi.fn(), canSubmit: true })

describe('Keypad', () => {
  it('shows 1 to 9, then Effacer, 0 and Valider', () => {
    render(<Keypad {...props()} />)
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent))
      .toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Effacer', '0', 'Valider'])
  })
  it('sends digits as text, erases and submits', async () => {
    const p = props()
    render(<Keypad {...p} />)
    await userEvent.click(screen.getByRole('button', { name: '0' }))
    await userEvent.click(screen.getByRole('button', { name: 'Effacer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(p.onKey).toHaveBeenCalledWith('0')
    expect(p.onErase).toHaveBeenCalledOnce()
    expect(p.onSubmit).toHaveBeenCalledOnce()
  })
  it('disables Valider when there is nothing to submit', () => {
    render(<Keypad {...props()} canSubmit={false} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
})
