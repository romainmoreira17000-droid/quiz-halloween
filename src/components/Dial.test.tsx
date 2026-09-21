/** @file Tests for one padlock dial. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dial } from './Dial'

describe('Dial', () => {
  it('shows its digit and turns both ways, wrapping around', async () => {
    const onChange = vi.fn()
    render(<Dial position={2} value={9} onChange={onChange} />)
    expect(screen.getByLabelText('Chiffre 2')).toHaveTextContent('9')
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : augmenter' }))
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : diminuer' }))
    expect(onChange.mock.calls).toEqual([[0], [8]])
  })
})
