/** @file Tests for the provisional end screen. */
import { render, screen } from '@testing-library/react'
import { AllSolvedScreen } from './AllSolvedScreen'

describe('AllSolvedScreen', () => {
  it('lists each step with its digit', () => {
    const steps = [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }]
    render(<AllSolvedScreen header={<header>entête</header>} steps={steps} foundDigits={[4, 0]} />)
    expect(screen.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['La crypte4', 'Le grenier0'])
  })
})
