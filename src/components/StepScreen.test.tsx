/** @file Tests for a step screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepScreen, type StepScreenProps } from './StepScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const base: StepScreenProps = {
  header: <header>entête</header>,
  step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', answer: { kind: 'digits', value: '7' }, digit: 7 },
  stepNumber: 2, total: 6, foundDigit: undefined, wrongAttempts: 0, isLast: false,
  onDigit: () => {}, onNext: () => {},
}

describe('StepScreen', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('shows the step and the keypad', () => {
    render(<StepScreen {...base} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getByText('Étape 2 sur 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le chaudron' })).toBeInTheDocument()
    expect(screen.getByText('Combien d’yeux ?')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('shows the step image under the site base path', () => {
    // Vitest serves from "/", so set the production base explicitly.
    vi.stubEnv('BASE_URL', '/quiz-halloween/')
    render(<StepScreen {...base} step={{ ...base.step, image: 'chaudron.png' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/quiz-halloween/images/chaudron.png')
  })
  it('sends keypad digits', async () => {
    const onDigit = vi.fn()
    render(<StepScreen {...base} onDigit={onDigit} />)
    await userEvent.click(screen.getByRole('button', { name: '3' }))
    expect(onDigit).toHaveBeenCalledWith(3)
  })
  it('shakes and shows a kind message after a wrong answer', () => {
    const { container } = render(<StepScreen {...base} wrongAttempts={2} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[1])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
  it('replaces the keypad with the found digit and a next button', async () => {
    const onNext = vi.fn()
    render(<StepScreen {...base} foundDigit={7} onNext={onNext} />)
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 7')
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Étape suivante' }))
    expect(onNext).toHaveBeenCalledOnce()
  })
  it('says "Continuer" after the last step', () => {
    render(<StepScreen {...base} foundDigit={7} isLast />)
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument()
  })
})
