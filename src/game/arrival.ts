/** @file The way to the room of a new slot: the tablet shows where to go until the group taps « Nous sommes arrivés ». */
import type { GamePhase } from './phase'

/**
 * Whether the group is still on its way to the room of the challenge on screen.
 * @param phase Current phase.
 * @param arrivedSlot Slot whose room the group reached, null before the first one.
 * @returns True on a challenge whose slot is not the one the group arrived in.
 */
export function isOnTheWay(phase: GamePhase, arrivedSlot: number | null): boolean {
  return phase.kind === 'challenge' && phase.slot !== arrivedSlot
}
