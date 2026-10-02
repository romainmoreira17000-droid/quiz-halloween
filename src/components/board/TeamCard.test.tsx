/** @file Tests for one team card of the animator board. */
import { fireEvent, render, screen } from '@testing-library/react'
import type { TeamCardView } from '../../game/boardCard'
import { TeamCard } from './TeamCard'

const view = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'La crypte', slotSecondsLeft: 252, found: [true, false, false],
  track: [{ title: 'Le grenier', digit: 7, current: false }, { title: 'La crypte', digit: null, current: true }, { title: 'La cave', digit: null, current: false }],
  solution: { answer: 'CHAUVE-SOURIS', digit: 4 }, hintTexts: [],
  blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null, silentSeconds: 4, freshness: 'fresh', ...over,
})

describe('TeamCard', () => {
  it('shows the status, the challenge, its clock and the digits found', () => {
    render(<TeamCard view={view({})} />)
    const card = screen.getByRole('article', { name: 'Zombies' })
    expect(card).toHaveTextContent('En épreuve')
    expect(card).toHaveTextContent('La crypte')
    expect(card).toHaveTextContent('04:12')
    expect(screen.getByLabelText('1 chiffre trouvé sur 3')).toBeInTheDocument()
    expect(card).toHaveTextContent('à l’instant')
  })
  it('shows the alerts', () => {
    render(<TeamCard view={view({ blockedSeconds: 45, wrongAttempts: 3, hints: { shown: 2, total: 3 }, offsetMinutes: -3 })} />)
    const card = screen.getByRole('article', { name: 'Zombies' })
    expect(card).toHaveTextContent('Bloquée 00:45')
    expect(card).toHaveTextContent('3 mauvaises réponses')
    expect(card).toHaveTextContent('Indices vus 2/3')
    expect(card).toHaveTextContent('Décalée de 3 min')
  })
  it('turns orange then red without news, and says when it never had any', () => {
    const { rerender } = render(<TeamCard view={view({ silentSeconds: 130, freshness: 'silent' })} />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveClass('team-card--silent')
    expect(screen.getByText('il y a 2 min')).toBeInTheDocument()
    rerender(<TeamCard view={view({ status: 'unseen', challengeTitle: null, slotSecondsLeft: null, silentSeconds: null, freshness: null })} />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveTextContent('Aucune nouvelle')
  })
  it('shows each digit found, in play order, and frames the challenge in play', () => {
    render(<TeamCard view={view({})} />)
    const boxes = screen.getAllByRole('listitem').filter((li) => li.closest('.team-card-digits'))
    expect(boxes.map((li) => li.textContent)).toEqual(['7', '–', '–'])
    expect(boxes[1]).toHaveAttribute('aria-current', 'step')
    expect(boxes[0]).toHaveAccessibleName('Le grenier : 7')
  })
  it('hides the solution until asked', () => {
    render(<TeamCard view={view({})} />)
    expect(screen.queryByText('CHAUVE-SOURIS')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir la solution' }))
    expect(screen.getByText('CHAUVE-SOURIS')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cacher la solution' }))
    expect(screen.queryByText('CHAUVE-SOURIS')).not.toBeInTheDocument()
  })
  it('hides the solution again when the team moves to another challenge', () => {
    const { rerender } = render(<TeamCard view={view({})} />)
    fireEvent.click(screen.getByRole('button', { name: 'Voir la solution' }))
    rerender(<TeamCard view={view({ challengeTitle: 'La cave', solution: { answer: 'OS', digit: 1 } })} />)
    expect(screen.queryByText('OS')).not.toBeInTheDocument()
  })
  it('lists the hints the team has seen', () => {
    render(<TeamCard view={view({ hints: { shown: 2, total: 3 }, hintTexts: ['Regardez sous la table', 'Comptez les chaises'] })} />)
    fireEvent.click(screen.getByText('Indices vus 2/3'))
    expect(screen.getByText('Comptez les chaises')).toBeVisible()
  })
  it('turns red while the team needs an animator', () => {
    render(<TeamCard view={view({})} alert />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveClass('team-card--alert')
  })
})
