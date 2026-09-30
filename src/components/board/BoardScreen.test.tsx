/** @file Tests for the animator board screen. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../../config/types'
import { quizFingerprint } from '../../game/fingerprint'
import { initialGameState } from '../../game/progress'
import type { BoardApi } from '../../services/board'
import { EVENING_CODE_KEY } from '../../services/savedEveningCode'
import { BoardScreen } from './BoardScreen'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [1, 2] },
}
const api = (result: 'ok' | 'refused' = 'ok') => {
  const now = Date.now()
  const state = { ...initialGameState(2), status: 'playing', startedAt: now - 60_000 }
  const snapshot = { serverNow: now, receivedAt: now, teams: [{ team: 'Zombies', fingerprint: quizFingerprint(config), state, updatedAt: now }] }
  const fake: BoardApi = {
    enabled: true, push: vi.fn(),
    read: vi.fn(() => Promise.resolve(result === 'ok' ? { result, snapshot } : { result, snapshot: null })),
    reset: vi.fn(() => Promise.resolve('ok' as const)),
  }
  return fake
}
const openWith = (code: string) => {
  fireEvent.change(screen.getByLabelText('Code de soirée'), { target: { value: code } })
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le tableau' }))
}

describe('BoardScreen', () => {
  it('asks for the evening code, then shows a card per team', async () => {
    const fake = api()
    render(<BoardScreen config={config} api={fake} />)
    openWith('CODE-123')
    expect(await screen.findByText('En épreuve')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Zombies' })).getByText('Le grenier')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Sorcières' })).getByText('Aucune nouvelle')).toBeInTheDocument()
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBe('CODE-123')
  })
  it('goes back to the code with « Code refusé » when the database refuses it', async () => {
    localStorage.setItem(EVENING_CODE_KEY, 'WRONG-CODE')
    render(<BoardScreen config={config} api={api('refused')} />)
    expect(await screen.findByText('Code refusé.')).toBeInTheDocument()
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBeNull()
  })
  it('empties the board after a confirmation, and can be cancelled', async () => {
    localStorage.setItem(EVENING_CODE_KEY, 'CODE-123')
    const fake = api()
    render(<BoardScreen config={config} api={fake} />)
    await screen.findByText('En épreuve')
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle soirée' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(fake.reset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle soirée' }))
    fireEvent.click(screen.getByRole('button', { name: 'Effacer le tableau' }))
    expect(fake.reset).toHaveBeenCalledWith('CODE-123')
  })
})
