/** @file Tests for the screen that sends the group to the room of a new slot. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TravelScreen } from './TravelScreen'

describe('TravelScreen', () => {
  it('names the room to go to, without the instruction or the keypad', () => {
    render(<TravelScreen header={<header>entête</header>} title="Le cimetière" onArrive={() => {}} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getByText('Maintenant, dirigez-vous vers :')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le cimetière' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
  it('lets the group say it arrived', async () => {
    const onArrive = vi.fn()
    render(<TravelScreen header={null} title="Le cimetière" onArrive={onArrive} />)
    await userEvent.click(screen.getByRole('button', { name: 'Nous sommes arrivés' }))
    expect(onArrive).toHaveBeenCalledOnce()
  })
})
