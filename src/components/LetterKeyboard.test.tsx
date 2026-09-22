/** @file Tests for the AZERTY letter keyboard. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnswerKeysProps } from './Keypad'
import { LetterKeyboard } from './LetterKeyboard'

const props = (): AnswerKeysProps => ({ onKey: vi.fn(), onErase: vi.fn(), onSubmit: vi.fn(), canSubmit: true })

describe('LetterKeyboard', () => {
  it('lays out the 26 letters in AZERTY order, with apostrophe, dash, space, erase and submit', () => {
    render(<LetterKeyboard {...props()} />)
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)
    expect(names).toEqual([...'AZERTYUIOPQSDFGHJKLMWXCVBN', 'Apostrophe', 'Tiret', 'Espace', 'Effacer', 'Valider'])
  })
  it('sends letters, apostrophe, dash and space as characters', async () => {
    const p = props()
    render(<LetterKeyboard {...p} />)
    for (const name of ['Q', 'Apostrophe', 'Tiret', 'Espace']) await userEvent.click(screen.getByRole('button', { name }))
    expect(vi.mocked(p.onKey).mock.calls).toEqual([['Q'], ["'"], ['-'], [' ']])
  })
  it('erases, submits, and disables Valider when empty', async () => {
    const p = props()
    const { rerender } = render(<LetterKeyboard {...p} />)
    await userEvent.click(screen.getByRole('button', { name: 'Effacer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(p.onErase).toHaveBeenCalledOnce()
    expect(p.onSubmit).toHaveBeenCalledOnce()
    rerender(<LetterKeyboard {...p} canSubmit={false} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
})
