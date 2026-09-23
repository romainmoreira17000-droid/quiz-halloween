/** @file Tests for the entrance message screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntranceScreen, DEFAULT_ENTRANCE_TITLE } from './EntranceScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const entrance = { title: 'Une lettre', message: 'Qui suis-je ?', answer: { kind: 'letters', value: 'Fantôme' } } as const

describe('EntranceScreen', () => {
  it('shows the title, the message and the letter keyboard, without clock', () => {
    render(<EntranceScreen entrance={entrance} wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Une lettre' })).toBeInTheDocument()
    expect(screen.getByText('Qui suis-je ?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Espace' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
  it('writes the message on a letter slipped under the door', () => {
    const { container } = render(<EntranceScreen entrance={entrance} wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(container.querySelector('.letter')).toContainElement(screen.getByText('Qui suis-je ?'))
  })
  it('uses a default title', () => {
    const { title: _title, ...untitled } = entrance
    render(<EntranceScreen entrance={untitled} wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: DEFAULT_ENTRANCE_TITLE })).toBeInTheDocument()
  })
  it('submits the typed answer', async () => {
    const onSubmit = vi.fn()
    render(<EntranceScreen entrance={entrance} wrongAttempts={0} onSubmit={onSubmit} />)
    for (const k of ['B', 'O', 'U', 'H']) await userEvent.click(screen.getByRole('button', { name: k }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalledWith('BOUH')
  })
  it('shakes and shows a kind message after a wrong answer', () => {
    const { container } = render(<EntranceScreen entrance={entrance} wrongAttempts={1} onSubmit={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[0])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
})
