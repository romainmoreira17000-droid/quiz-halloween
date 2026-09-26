/** @file Tests for the hint button and its window. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HintButton } from './HintButton'

describe('HintButton', () => {
  it('stays greyed with its countdown until the hint is available', () => {
    render(<HintButton hint="Sous le chaudron." secondsLeft={180} />)
    expect(screen.getByRole('button', { name: 'Indice dans 03:00' })).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('opens the hint in a window, closed by « Fermer » or Escape, and reopens at will', async () => {
    render(<HintButton hint="Sous le chaudron." secondsLeft={0} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous le chaudron.')
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
