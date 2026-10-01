/** @file Tests for a step screen. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepScreen, type StepScreenProps } from './StepScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const base: StepScreenProps = {
  header: <header>entête</header>,
  step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', answer: { kind: 'digits', value: '7' }, digit: 7 },
  challenge: 1, digits: [4, null, null, null, null, null], wrongAttempts: 0, secondsLeft: 252, nextLabel: 'Changement d’épreuve dans', blockSecondsLeft: 0, hintsAvailable: 0, secondsToNextHint: null,
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
    expect(screen.getByText('Changement d’épreuve dans 04:12')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin')[1]).toHaveClass('lock-pin--falling')
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
  })
  it('shows the waiting message once the digit is found', () => {
    render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} waitingMessage="Goûtez les bonbons !" />)
    expect(screen.getByText('Goûtez les bonbons !')).toBeInTheDocument()
  })
  it('keeps the waiting message hidden while the digit is not found', () => {
    render(<StepScreen {...base} waitingMessage="Goûtez les bonbons !" />)
    expect(screen.queryByText('Goûtez les bonbons !')).not.toBeInTheDocument()
  })
  it('tells the story of the room above the waiting message once the digit is found', () => {
    const step = { ...base.step, story: 'Le fantôme soupire.' }
    render(<StepScreen {...base} step={step} digits={[4, 7, null, null, null, null]} waitingMessage="Goûtez les bonbons !" />)
    const story = screen.getByText('Le fantôme soupire.')
    expect(story.compareDocumentPosition(screen.getByText('Goûtez les bonbons !')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
  it('keeps the story hidden while the digit is not found', () => {
    render(<StepScreen {...base} step={{ ...base.step, story: 'Le fantôme soupire.' }} />)
    expect(screen.queryByText('Le fantôme soupire.')).not.toBeInTheDocument()
  })
  it('announces the padlock during the last slot', () => {
    render(<StepScreen {...base} digits={[4, 7, 1, 2, 0, 9]} nextLabel="Le cadenas final dans" />)
    expect(screen.getByText('Le cadenas final dans 04:12')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Cadenas ouvert/ })).toBeInTheDocument()
  })
  it('announces the final', () => {
    render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} nextLabel="L’épreuve finale dans" />)
    expect(screen.getByText('L’épreuve finale dans 04:12')).toBeInTheDocument()
  })
  it('shows no countdown without a label (the final, before the padlock)', () => {
    render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} nextLabel={null} />)
    expect(screen.queryByText(/dans \d\d:\d\d/)).not.toBeInTheDocument()
  })
  it('blocks the keyboard after a wrong answer', () => {
    render(<StepScreen {...base} wrongAttempts={1} blockSecondsLeft={59} />)
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 00:59')
    expect(screen.getByRole('button', { name: '7' })).toBeDisabled()
  })
  it('shows no hint button without a hint', () => {
    render(<StepScreen {...base} />)
    expect(screen.queryByRole('button', { name: /indice/i })).not.toBeInTheDocument()
  })
  it('shows the hint button on the parchment, with its countdown', () => {
    render(<StepScreen {...base} step={{ ...base.step, hints: ['Sous le chaudron.'] }} secondsToNextHint={125} />)
    expect(screen.getByRole('button', { name: 'Indice dans 02:05' })).toBeDisabled()
  })
  it('shows how many hints are unlocked', () => {
    render(<StepScreen {...base} step={{ ...base.step, hints: ['a', 'b', 'c'] }} hintsAvailable={2} secondsToNextHint={60} />)
    expect(screen.getByRole('button', { name: 'Voir les indices (2/3)' })).toBeEnabled()
  })
  it('hides the hint once the digit is found', () => {
    render(<StepScreen {...base} step={{ ...base.step, hints: ['Sous le chaudron.'] }} digits={[4, 7, null, null, null, null]} />)
    expect(screen.queryByRole('button', { name: /indice/i })).not.toBeInTheDocument()
  })

  describe('celebration', () => {
    const solved = [4, 7, null, null, null, null]
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('celebrates once the lock has stopped jolting, then goes away on its own', () => {
      const { rerender } = render(<StepScreen {...base} />)
      rerender(<StepScreen {...base} digits={solved} />)
      // The pin falls (0.45 s) and the lock jolts on its chain (0.4 s → 1.5 s, lock.css): the opaque « Bravo ! » must not hide it.
      act(() => vi.advanceTimersByTime(1400))
      expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(200))
      expect(screen.getByRole('dialog', { name: 'Bravo !' })).toHaveTextContent('7')
      act(() => vi.advanceTimersByTime(3000))
      expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
    })
    it('closes on a tap', () => {
      const { rerender } = render(<StepScreen {...base} />)
      rerender(<StepScreen {...base} digits={solved} />)
      act(() => vi.advanceTimersByTime(1600))
      fireEvent.click(screen.getByRole('dialog', { name: 'Bravo !' }))
      expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
    })
    it('tells when the « Bravo ! » is closed by a tap', () => {
      const onCelebrationEnd = vi.fn()
      const { rerender } = render(<StepScreen {...base} onCelebrationEnd={onCelebrationEnd} />)
      rerender(<StepScreen {...base} digits={solved} onCelebrationEnd={onCelebrationEnd} />)
      act(() => vi.advanceTimersByTime(1600))
      fireEvent.click(screen.getByRole('dialog', { name: 'Bravo !' }))
      expect(onCelebrationEnd).toHaveBeenCalledOnce()
    })
    it('does not celebrate again when the screen opens already solved (reload)', () => {
      render(<StepScreen {...base} digits={solved} />)
      act(() => vi.advanceTimersByTime(1600))
      expect(screen.queryByRole('dialog', { name: 'Bravo !' })).not.toBeInTheDocument()
    })
  })
})
