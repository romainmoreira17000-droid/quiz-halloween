/** @file Test helper for the screens that came before « Dirigez-vous vers » (#90): the group is in the room at once. */
import { fireEvent, screen } from '@testing-library/react'

/** Taps « Nous sommes arrivés » when the way to a room is on screen; does nothing otherwise. */
export function arriveIfAsked(): void {
  const button = screen.queryByRole('button', { name: 'Nous sommes arrivés' })
  if (button) fireEvent.click(button)
}
