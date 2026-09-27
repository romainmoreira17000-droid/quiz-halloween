/** @file Tests for the hint button and its window. */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HintButton } from './HintButton'

const HINTS = ['Sous le chaudron.', 'Près du feu.', 'Dans la marmite.']

describe('HintButton', () => {
  it('stays greyed with its countdown until the first hint', () => {
    render(<HintButton hints={HINTS} available={0} secondsToNext={180} />)
    expect(screen.getByRole('button', { name: 'Indice dans 03:00' })).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('shows the available hints, numbered, and the time before the next one', async () => {
    render(<HintButton hints={HINTS} available={1} secondsToNext={170} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice (1/3)' }))
    const dialog = screen.getByRole('dialog', { name: 'Indices' })
    expect(within(dialog).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Sous le chaudron.'])
    expect(dialog).toHaveTextContent('Indice suivant dans 02:50')
  })
  it('updates the open window when a new hint arrives, without a next line once all are out', async () => {
    const { rerender } = render(<HintButton hints={HINTS} available={2} secondsToNext={100} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir les indices (2/3)' }))
    rerender(<HintButton hints={HINTS} available={3} secondsToNext={null} />)
    const dialog = screen.getByRole('dialog', { name: 'Indices' })
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3)
    expect(dialog).not.toHaveTextContent('Indice suivant')
  })
  it('keeps the single-hint wording', async () => {
    render(<HintButton hints={['Sous le chaudron.']} available={1} secondsToNext={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous le chaudron.')
  })
  it('opens the window, closed by « Fermer » or Escape, and reopens at will', async () => {
    render(<HintButton hints={['Sous le chaudron.']} available={1} secondsToNext={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
