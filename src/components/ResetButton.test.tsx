/** @file Tests for the long-press reset button. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RESET_HOLD_MS, ResetButton } from './ResetButton'

const NAME = 'Recommencer la partie (appui long)'

describe('ResetButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires only after a 3-second press, and shows the ring while held', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    const button = screen.getByRole('button', { name: NAME })
    fireEvent.pointerDown(button)
    expect(button).toHaveClass('reset-button--holding')
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS - 1))
    expect(onLongPress).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onLongPress).toHaveBeenCalledOnce()
    expect(button).not.toHaveClass('reset-button--holding')
  })
  it('does nothing when released too early', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    const button = screen.getByRole('button', { name: NAME })
    fireEvent.pointerDown(button)
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.pointerUp(button)
    expect(button).not.toHaveClass('reset-button--holding')
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    expect(onLongPress).not.toHaveBeenCalled()
  })
  it('works with a key held down', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    fireEvent.keyDown(screen.getByRole('button', { name: NAME }), { key: 'Enter' })
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    expect(onLongPress).toHaveBeenCalledOnce()
  })
})
