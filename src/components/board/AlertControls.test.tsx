/** @file Tests for the alert banner and the « Activer les alertes » button. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { AlertBanner } from './AlertBanner'
import { AlertToggle } from './AlertToggle'

describe('AlertBanner', () => {
  it('shows nothing without alerts', () => {
    render(<AlertBanner alerts={[]} onSeen={vi.fn()} />)
    expect(screen.queryByRole('list', { name: 'Alertes' })).not.toBeInTheDocument()
  })
  it('lists each alert with its « Vu »', () => {
    const onSeen = vi.fn()
    const alert = { key: 'Zombies|timeUp|Le cimetière', team: 'Zombies', kind: 'timeUp' as const, text: 'Zombies : Temps écoulé (Le cimetière)' }
    render(<AlertBanner alerts={[alert]} onSeen={onSeen} />)
    const list = screen.getByRole('list', { name: 'Alertes' })
    expect(list).toHaveTextContent('Zombies : Temps écoulé (Le cimetière)')
    fireEvent.click(within(list).getByRole('button', { name: 'Vu' }))
    expect(onSeen).toHaveBeenCalledWith(alert.key)
  })
})

describe('AlertToggle', () => {
  it('offers to turn the alerts on', () => {
    const onEnable = vi.fn()
    render(<AlertToggle enabled={false} wakeLock="off" onEnable={onEnable} />)
    fireEvent.click(screen.getByRole('button', { name: 'Activer les alertes' }))
    expect(onEnable).toHaveBeenCalledOnce()
  })
  it('says they are on, and asks to keep the screen on when the phone cannot', () => {
    const { rerender } = render(<AlertToggle enabled wakeLock="on" onEnable={vi.fn()} />)
    expect(screen.getByText('Alertes activées')).toBeInTheDocument()
    rerender(<AlertToggle enabled wakeLock="unavailable" onEnable={vi.fn()} />)
    expect(screen.getByText('Alertes activées · Garde l’écran allumé')).toBeInTheDocument()
  })
})
