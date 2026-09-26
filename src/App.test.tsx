/** @file Tests for the root component's config handling. */
import { render, screen } from '@testing-library/react'
import App from './App'
import type { ValidationResult } from './config/types'

const ok: ValidationResult = { ok: true, config: {
  title: 'Le manoir hanté', teams: ['Sorcières'], slotMinutes: 15, animatorCode: '2710', stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', answer: { kind: 'digits', value: '1' }, digit: 1 }], padlock: { order: [1] } } }

describe('App', () => {
  it('shows the tablet setup of the configured quiz', () => {
    render(<App quiz={ok} />)
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
  })
  it('lists config errors instead of the game', () => {
    render(<App quiz={{ ok: false, errors: ['étape 2 : oups', 'étape 4 : aïe'] }} />)
    expect(screen.getByRole('heading', { name: 'Le quiz est mal configuré' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['étape 2 : oups', 'étape 4 : aïe'])
  })
})
