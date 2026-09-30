/** @file Tests for the animator menu window. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuizStep } from '../config/types'
import { AnimatorMenu } from './AnimatorMenu'

const steps: QuizStep[] = [
  { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '0472' }, digit: 4, hints: ['Sous la dalle', 'Derrière'] },
  { title: 'Le grenier', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0 },
]

describe('AnimatorMenu', () => {
  it('runs an action, then closes', async () => {
    const onSolve = vi.fn()
    const onClose = vi.fn()
    render(<AnimatorMenu steps={steps} code={[0, 4]} challengeTitle="Le grenier" onSolve={onSolve} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Menu animateur' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Valider l’épreuve « Le grenier »' }))
    expect(onSolve).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('offers only the possible actions', async () => {
    const onUnblock = vi.fn()
    const onShow = vi.fn()
    const { rerender } = render(<AnimatorMenu steps={steps} code={[0, 4]} onClose={vi.fn()} />)
    expect(screen.getByText('Rien à débloquer sur cet écran.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Valider|Débloquer|indice/ })).not.toBeInTheDocument()
    rerender(<AnimatorMenu steps={steps} code={[0, 4]} onUnblock={onUnblock} nextHint={{ number: 2, total: 3, onShow }} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Débloquer la saisie' }))
    await userEvent.click(screen.getByRole('button', { name: 'Débloquer l’indice suivant (2/3)' }))
    expect(onUnblock).toHaveBeenCalledOnce()
    expect(onShow).toHaveBeenCalledOnce()
  })
  it('asks to confirm before moving on to the next challenge', async () => {
    const onSkip = vi.fn()
    const onClose = vi.fn()
    render(<AnimatorMenu steps={steps} code={[0, 4]} onSkip={onSkip} onClose={onClose} />)
    expect(screen.queryByText('Rien à débloquer sur cet écran.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Passer à l’épreuve suivante' }))
    expect(onSkip).not.toHaveBeenCalled()
    expect(screen.getByText('À faire sur toutes les tablettes, sinon les équipes se croisent.')).toBeInTheDocument()
    // « Annuler » only takes the question back, the menu stays open.
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByText('À faire sur toutes les tablettes, sinon les équipes se croisent.')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Passer à l’épreuve suivante' }))
    await userEvent.click(screen.getByRole('button', { name: 'Oui, passer à l’épreuve suivante' }))
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('changes the start time, and says why a time is refused', async () => {
    const onSet = vi.fn((text: string) => text !== '21:00')
    const onClose = vi.fn()
    render(<AnimatorMenu steps={steps} code={[0, 4]} start={{ value: '20:05', onSet }} onClose={onClose} />)
    const field = screen.getByLabelText('Départ de la partie')
    expect(field).toHaveValue('20:05')
    fireEvent.change(field, { target: { value: '21:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Recaler l’heure de départ' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Cette heure n’est pas encore passée.')
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.change(field, { target: { value: '20:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Recaler l’heure de départ' }))
    expect(onSet).toHaveBeenLastCalledWith('20:00')
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('shows the answers and the padlock code on demand', async () => {
    render(<AnimatorMenu steps={steps} code={[0, 4]} onClose={vi.fn()} />)
    expect(screen.queryByText('0472')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voir les solutions' }))
    const list = screen.getByRole('list', { name: 'Solutions' })
    expect(list).toHaveTextContent('1. La crypte0472→ 4')
    expect(list).toHaveTextContent('2. Le grenierFantôme→ 0')
    expect(within(list).getByRole('list', { name: 'Indices de La crypte' })).toHaveTextContent('Sous la dalleDerrière')
    expect(within(list).queryByRole('list', { name: 'Indices de Le grenier' })).not.toBeInTheDocument()
    expect(screen.getByText('Code du cadenas : 0 4')).toBeInTheDocument()
  })
  it('closes with « Fermer », focused, or Escape', async () => {
    const onClose = vi.fn()
    render(<AnimatorMenu steps={steps} code={[0, 4]} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
  it('shows the remote follow-up line when given', () => {
    render(<AnimatorMenu steps={steps} code={[0, 4]} remote="hors ligne depuis 2 min" onClose={vi.fn()} />)
    expect(screen.getByText('Suivi à distance : hors ligne depuis 2 min')).toBeInTheDocument()
  })
})
