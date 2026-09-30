/** @file Tests for the tablet setup screen. */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamSetupScreen } from './TeamSetupScreen'

const TEAMS = ['Sorcières', 'Zombies']
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }))
async function typeCode(code: string) {
  for (const digit of code) await press(digit)
  await press('Valider')
}

describe('TeamSetupScreen', () => {
  it('asks for the animator code first, shown as dots', async () => {
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" eveningCode={null} onChoose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Zombies' })).not.toBeInTheDocument()
    await press('2')
    await press('7')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('••')
  })
  it('refuses a wrong code', async () => {
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" eveningCode={null} onChoose={vi.fn()} />)
    await typeCode('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
    expect(screen.queryByRole('button', { name: 'Zombies' })).not.toBeInTheDocument()
  })
  it('lists the teams once the code is right, and gives back the chosen one', async () => {
    const onChoose = vi.fn()
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" eveningCode={null} onChoose={onChoose} />)
    await typeCode('2710')
    expect(screen.getByText('Quelle équipe joue sur cette tablette ?')).toBeInTheDocument()
    await press('Zombies')
    expect(onChoose).toHaveBeenCalledWith(1, '')
  })
  it('passes the evening code typed with the chosen team', () => {
    const onChoose = vi.fn()
    render(<TeamSetupScreen teams={['Sorcières', 'Zombies']} animatorCode="2710" eveningCode={null} onChoose={onChoose} />)
    for (const digit of '2710') fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    fireEvent.change(screen.getByLabelText('Code de soirée (facultatif)'), { target: { value: 'CITROUILLE-42' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zombies' }))
    expect(onChoose).toHaveBeenCalledWith(1, 'CITROUILLE-42')
  })
  it('shows the saved evening code', () => {
    render(<TeamSetupScreen teams={['Sorcières']} animatorCode="2710" eveningCode="CITROUILLE-42" onChoose={vi.fn()} />)
    for (const digit of '2710') fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByLabelText('Code de soirée (facultatif)')).toHaveValue('CITROUILLE-42')
  })
})
