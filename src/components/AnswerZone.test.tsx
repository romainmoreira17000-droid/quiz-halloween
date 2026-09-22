/** @file Tests for the shared wrong-answer feedback zone. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerZone } from './AnswerZone'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

describe('AnswerZone', () => {
  it('shows no alert and no shake with no wrong attempt', () => {
    const { container } = render(<AnswerZone kind="digits" wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(container.querySelector('.shake')).toBeNull()
  })
  it('shakes and shows the kind message matching the attempt number after a wrong try', () => {
    const { container } = render(<AnswerZone kind="digits" wrongAttempts={2} onSubmit={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[1])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
  it('submits the typed answer', async () => {
    const onSubmit = vi.fn()
    render(<AnswerZone kind="letters" wrongAttempts={0} onSubmit={onSubmit} />)
    for (const k of ['C', 'H', 'A', 'T']) await userEvent.click(screen.getByRole('button', { name: k }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalledWith('CHAT')
  })
  it('clears the typed text after a wrong answer', async () => {
    const { rerender } = render(<AnswerZone kind="digits" wrongAttempts={0} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '1' }))
    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('12')
    // A new wrongAttempts remounts the zone (key change), which should drop the typed text.
    rerender(<AnswerZone kind="digits" wrongAttempts={1} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Réponse tapée')).not.toHaveTextContent('12')
  })
})
