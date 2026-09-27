/** @file Tests for the test mode badge and skip button. */
import { fireEvent, render, screen } from '@testing-library/react'
import { TestModeControl } from './TestModeControl'

describe('TestModeControl', () => {
  it('shows the badge and skips on tap', () => {
    const onSkip = vi.fn()
    render(<TestModeControl onSkip={onSkip} />)
    expect(screen.getByText('Mode test')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Épreuve suivante' }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
  it('shows only the badge where skipping makes no sense', () => {
    render(<TestModeControl />)
    expect(screen.getByText('Mode test')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
