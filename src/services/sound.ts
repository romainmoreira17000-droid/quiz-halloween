/**
 * @file Victory sound (lock clack, door creak, ghost moan) and pin clack, synthesised with Web Audio:
 * no audio file to host or license, and it works offline. Timings match victory.css and lock.css.
 */

/** Creates the audio context; null when the browser has no Web Audio (e.g. jsdom). */
export type AudioContextFactory = () => AudioContext | null

const browserContext: AudioContextFactory = () => (typeof AudioContext === 'undefined' ? null : new AudioContext())

/** Gain that rises to `level`, holds, then fades out, so notes never click. */
function envelope(ctx: AudioContext, start: number, end: number, level: number): GainNode {
  const length = end - start
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.05, length / 4))
  gain.gain.setValueAtTime(level, end - Math.min(0.3, length / 2))
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  gain.connect(ctx.destination)
  return gain
}

/** Oscillator wired to an envelope, with an optional wobble on its pitch. */
function tone(
  ctx: AudioContext, type: OscillatorType, start: number, end: number, level: number,
  wobble?: { rate: number; depth: number },
): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.connect(envelope(ctx, start, end, level))
  if (wobble) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = wobble.rate
    const depth = ctx.createGain()
    depth.gain.value = wobble.depth
    lfo.connect(depth)
    depth.connect(osc.frequency)
    lfo.start(start)
    lfo.stop(end)
  }
  osc.start(start)
  osc.stop(end)
  return osc
}

/** @returns A new context, or null if Web Audio is missing or blocked. */
function openContext(createContext: AudioContextFactory): AudioContext | null {
  try {
    return createContext()
  } catch {
    return null
  }
}

/**
 * Plays the victory sound. Must be called inside the tap handler: tablets only allow
 * sound started by a user gesture. Silent (never throws) when audio is unavailable.
 * @param createContext Audio context factory, replaced in tests.
 */
export function playVictorySound(createContext: AudioContextFactory = browserContext): void {
  const ctx = openContext(createContext)
  if (!ctx) return
  const t = ctx.currentTime
  // Lock clack as the shackle springs up.
  const clack = tone(ctx, 'square', t + 0.2, t + 0.28, 0.2)
  clack.frequency.setValueAtTime(880, t + 0.2)
  // Hinge creak while the doors swing (1 s → 3 s): a raspy sawtooth whose pitch drifts.
  const creak = tone(ctx, 'sawtooth', t + 1, t + 3, 0.12, { rate: 18, depth: 30 })
  creak.frequency.setValueAtTime(80, t + 1)
  creak.frequency.linearRampToValueAtTime(150, t + 1.8)
  creak.frequency.linearRampToValueAtTime(100, t + 2.4)
  creak.frequency.linearRampToValueAtTime(170, t + 3)
  // Ghost moan as the ghosts escape.
  const moan = tone(ctx, 'sine', t + 2.2, t + 4.4, 0.18, { rate: 5, depth: 12 })
  moan.frequency.setValueAtTime(300, t + 2.2)
  moan.frequency.linearRampToValueAtTime(520, t + 3.2)
  moan.frequency.linearRampToValueAtTime(260, t + 4.4)
  // Browsers cap the number of open contexts: release this one when done.
  moan.onended = () => void ctx.close()
}

/**
 * Plays the short clack of a pin dropping in the padlock. Must be called inside the tap handler.
 * Silent (never throws) when audio is unavailable.
 * @param createContext Audio context factory, replaced in tests.
 */
export function playPinSound(createContext: AudioContextFactory = browserContext): void {
  const ctx = openContext(createContext)
  if (!ctx) return
  const t = ctx.currentTime
  // Lands when the pin hits the bottom of its slot (pin-fall in lock.css lasts 0.45 s).
  const clack = tone(ctx, 'square', t + 0.4, t + 0.47, 0.16)
  clack.frequency.setValueAtTime(1200, t + 0.4)
  clack.frequency.exponentialRampToValueAtTime(500, t + 0.47)
  clack.onended = () => void ctx.close()
}
