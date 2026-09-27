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

  it('shows a hidden drum of ten digits turned to its digit', () => {
    const { container } = render(<Dial position={1} value={3} onChange={() => {}} />)
    const drum = container.querySelector('.dial-drum')
    expect(drum).toHaveAttribute('aria-hidden', 'true')
    expect([...container.querySelectorAll('.dial-face')].map((face) => face.textContent)).toEqual(
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(drum).toHaveStyle({ '--drum-angle': '108deg' })
  })
  it('keeps rolling forward from 9 to 0', () => {
    const { container, rerender } = render(<Dial position={1} value={9} onChange={() => {}} />)
    rerender(<Dial position={1} value={0} onChange={() => {}} />)
    expect(container.querySelector('.dial-drum')).toHaveStyle({ '--drum-angle': '360deg' })
  })
})
