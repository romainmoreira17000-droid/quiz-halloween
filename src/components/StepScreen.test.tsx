/** @file Tests for a step screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepScreen, type StepScreenProps } from './StepScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const base: StepScreenProps = {
  header: <header>entête</header>,
  step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', answer: { kind: 'digits', value: '7' }, digit: 7 },
  challenge: 1, digits: [4, null, null, null, null, null], wrongAttempts: 0, secondsLeft: 252, isLastSlot: false,
  onSubmit: () => {},
}

describe('StepScreen', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('shows the step and the keypad', () => {
    render(<StepScreen {...base} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.queryByText(/Étape \d sur/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le chaudron' })).toBeInTheDocument()
    expect(screen.getByText('Combien d’yeux ?')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect(screen.getByLabelText('Réponse tapée')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cadenas : 1 goupille tombée sur 6' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Image de l’étape/ })).not.toBeInTheDocument()
  })
  it('shows the step image under the site base path', () => {
    // Vitest serves from "/", so set the production base explicitly.
    vi.stubEnv('BASE_URL', '/quiz-halloween/')
    render(<StepScreen {...base} step={{ ...base.step, image: 'chaudron.png' }} />)
    expect(screen.getByRole('img', { name: 'Image de l’étape : Le chaudron' })).toHaveAttribute('src', '/quiz-halloween/images/chaudron.png')
  })
  it('submits the typed code', async () => {
    const onSubmit = vi.fn()
    render(<StepScreen {...base} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: '1' }))
    await userEvent.click(screen.getByRole('button', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalledWith('13')
  })
  it('shows the letter keyboard for a words answer', () => {
    render(<StepScreen {...base} step={{ ...base.step, answer: { kind: 'letters', value: 'Crapaud' } }} />)
    expect(screen.getByRole('button', { name: 'Espace' })).toBeInTheDocument()
  })
  it('shakes and shows a kind message after a wrong answer', () => {
    const { container } = render(<StepScreen {...base} wrongAttempts={2} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[1])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
  it('drops the pin, shows the found digit and the time before the next room', () => {
    const { container } = render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} />)
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 7')
    expect(screen.getByText('Changement de salle dans 04:12')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin')[1]).toHaveClass('lock-pin--falling')
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
  })
  it('announces the padlock during the last slot', () => {
    render(<StepScreen {...base} digits={[4, 7, 1, 2, 0, 9]} isLastSlot />)
    expect(screen.getByText('Le cadenas final dans 04:12')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Cadenas ouvert/ })).toBeInTheDocument()
  })
})
