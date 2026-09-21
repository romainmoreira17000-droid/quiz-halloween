/** @file Tests for the reset confirmation window. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetDialog } from './ResetDialog'

describe('ResetDialog', () => {
  it('asks for confirmation, with "Annuler" focused', async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<ResetDialog onCancel={onCancel} onConfirm={onConfirm} />)
    expect(screen.getByRole('dialog', { name: 'Recommencer la partie ?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
