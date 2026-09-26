/** @file Tests for the « Temps écoulé » screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuizStep } from '../config/types'
import { TimeUpScreen } from './TimeUpScreen'

const step: QuizStep = { title: 'La bibliothèque', instruction: 'x', answer: { kind: 'digits', value: '0472' }, digit: 2 }
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }))
async function typeCode(code: string) {
  for (const digit of code) await press(digit)
  await press('Valider')
}

describe('TimeUpScreen', () => {
  it('calls for an animator and hides the code being typed', async () => {
    render(<TimeUpScreen header={<header>entête</header>} step={step} animatorCode="2710" onUnlock={vi.fn()} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve : La bibliothèque')).toBeInTheDocument()
    await press('2')
    await press('7')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('••')
  })
  it('refuses a wrong code', async () => {
    render(<TimeUpScreen header={null} step={step} animatorCode="2710" onUnlock={vi.fn()} />)
    await typeCode('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
  })
  it('shows the digit once the code is right, then goes on with that code', async () => {
    const onUnlock = vi.fn()
    render(<TimeUpScreen header={null} step={step} animatorCode="2710" onUnlock={onUnlock} />)
    await typeCode('2710')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre de l’épreuve : 2')
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
    await press('Continuer')
    expect(onUnlock).toHaveBeenCalledWith('2710')
  })
})
