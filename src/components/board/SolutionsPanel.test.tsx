/** @file Tests for the solutions panel of the animator board. */
import { fireEvent, render, screen } from '@testing-library/react'
import type { QuizConfig } from '../../config/types'
import { SolutionsPanel } from './SolutionsPanel'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières'], slotMinutes: 15, hintTimes: [5], blockSeconds: 0, animatorCode: '1717', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'letters', value: 'Os' }, digit: 4, hints: ['Sous la dalle'] },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '07' }, digit: 0 },
  ],
  finalStep: 1, padlock: { order: [2, 1] },
}

describe('SolutionsPanel', () => {
  it('is folded, then lists every challenge, the padlock code and the animator code', () => {
    render(<SolutionsPanel config={config} />)
    expect(screen.getByText('Sous la dalle')).not.toBeVisible()
    fireEvent.click(screen.getByText('Solutions (à ne pas montrer aux enfants)'))
    expect(screen.getByText('Sous la dalle')).toBeVisible()
    expect(screen.getByText('Le grenier (finale)')).toBeInTheDocument()
    expect(screen.getByText('07')).toBeInTheDocument()
    expect(screen.getByText('0 4')).toBeInTheDocument()
    expect(screen.getByText('1717')).toBeInTheDocument()
  })
})
