/** @file Tests for the typed answer and its keyboard. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerInput } from './AnswerInput'

const typed = () => screen.getByLabelText('Réponse tapée')
// A plain string name already matches the full accessible name (testing-library's default),
// so no `exact` option is needed — unlike Playwright locators, which default to substring matching.
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }))

describe('AnswerInput', () => {
  it('uses the keypad for digits and submits the typed code', async () => {
    const onSubmit = vi.fn()
    render(<AnswerInput kind="digits" onSubmit={onSubmit} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
    for (const d of ['0', '4', '7', '9']) await press(d)
    await press('Effacer')
    await press('2')
    expect(typed()).toHaveTextContent('0472')
    await press('Valider')
    expect(onSubmit).toHaveBeenCalledWith('0472')
  })
  it('uses the letter keyboard for words', async () => {
    const onSubmit = vi.fn()
    render(<AnswerInput kind="letters" onSubmit={onSubmit} />)
    for (const k of ['C', 'H', 'A', 'T']) await press(k)
    await press('Valider')
    expect(onSubmit).toHaveBeenCalledWith('CHAT')
  })
  it('keeps Valider disabled for spaces only', async () => {
    render(<AnswerInput kind="letters" onSubmit={vi.fn()} />)
    await press('Espace')
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
  it('stops at 12 digits', async () => {
    render(<AnswerInput kind="digits" onSubmit={vi.fn()} />)
    for (let i = 0; i < 14; i++) await press('1')
    expect(typed()).toHaveTextContent('1'.repeat(12))
  })
})
