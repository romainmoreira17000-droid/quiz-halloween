/** @file Tests for the padlock screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PadlockScreen, type PadlockScreenProps } from './PadlockScreen'

const steps = [
  { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
  { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
] as const
const props: PadlockScreenProps = {
  header: <header>entête</header>, steps, foundDigits: [4, 0], wrongAttempts: 0, onOpen: vi.fn(),
}

describe('PadlockScreen', () => {
  it('recalls each step with its digit and shows one dial per step, at 0', () => {
    render(<PadlockScreen {...props} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
    const recap = screen.getByRole('list', { name: 'Chiffres trouvés' })
    expect([...recap.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['La crypte4', 'Le grenier0'])
    expect(screen.getByLabelText('Chiffre 1')).toHaveTextContent('0')
    expect(screen.getByLabelText('Chiffre 2')).toHaveTextContent('0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('shows the configured title and hint', () => {
    render(<PadlockScreen {...props} title="La porte du restaurant" hint="Le grenier d’abord" />)
    expect(screen.getByRole('heading', { name: 'La porte du restaurant' })).toBeInTheDocument()
    expect(screen.getByText('Le grenier d’abord')).toBeInTheDocument()
  })
  it('sends the dial digits when "Ouvrir" is pressed', async () => {
    const onOpen = vi.fn()
    render(<PadlockScreen {...props} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : diminuer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(onOpen).toHaveBeenCalledWith([0, 9])
  })
  it('keeps the dials and shows a message after a wrong code', async () => {
    const { rerender } = render(<PadlockScreen {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 1 : augmenter' }))
    rerender(<PadlockScreen {...props} wrongAttempts={1} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Le cadenas ne bouge pas')
    expect(screen.getByLabelText('Chiffre 1')).toHaveTextContent('1')
  })
})
