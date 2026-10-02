/** @file Tests for one team card of the animator board. */
import { render, screen } from '@testing-library/react'
import type { TeamCardView } from '../../game/boardCard'
import { TeamCard } from './TeamCard'

const view = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'La crypte', slotSecondsLeft: 252, found: [true, false, false], track: [], solution: null, hintTexts: [],
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
})
