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
  it('cancels with the Escape key', async () => {
    const onCancel = vi.fn()
    render(<ResetDialog onCancel={onCancel} onConfirm={vi.fn()} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })
  it('offers to change the team only when asked to', async () => {
    const { rerender } = render(<ResetDialog onCancel={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Changer d’équipe' })).not.toBeInTheDocument()
    const onChangeTeam = vi.fn()
    rerender(<ResetDialog onCancel={vi.fn()} onConfirm={vi.fn()} onChangeTeam={onChangeTeam} />)
    await userEvent.click(screen.getByRole('button', { name: 'Changer d’équipe' }))
    expect(onChangeTeam).toHaveBeenCalledOnce()
  })
})
