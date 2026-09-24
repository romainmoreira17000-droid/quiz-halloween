/** @file Tests for the reset icon + confirmation. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RESET_HOLD_MS } from './ResetButton'
import { ResetControl } from './ResetControl'

function holdResetIcon() {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
}

describe('ResetControl', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('asks after a long press, and cancelling keeps the game', () => {
    const onReset = vi.fn()
    render(<ResetControl onReset={onReset} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    holdResetIcon()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })
  it('resets once confirmed', () => {
    const onReset = vi.fn()
    render(<ResetControl onReset={onReset} />)
    holdResetIcon()
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('changes the team from the window, which closes', () => {
    const onChangeTeam = vi.fn()
    render(<ResetControl onReset={vi.fn()} onChangeTeam={onChangeTeam} />)
    holdResetIcon()
    fireEvent.click(screen.getByRole('button', { name: 'Changer d’équipe' }))
    expect(onChangeTeam).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
