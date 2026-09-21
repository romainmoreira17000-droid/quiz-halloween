/** @file Tests for the synthesised victory sound (fake Web Audio context). */
import { playVictorySound } from './sound'

function fakeParam() {
  return { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
}

function fakeContext() {
  const oscillators: { type: string; start: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = []
  const ctx = {
    currentTime: 0,
    destination: {},
    close: vi.fn(() => Promise.resolve()),
    createGain: () => ({ gain: fakeParam(), connect: vi.fn() }),
    createOscillator: () => {
      const osc = { type: 'sine', frequency: fakeParam(), connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }
      oscillators.push(osc)
      return osc
    },
  }
  return { ctx: ctx as unknown as AudioContext, close: ctx.close, oscillators }
}

describe('playVictorySound', () => {
  it('does nothing without Web Audio', () => {
    expect(() => playVictorySound(() => null)).not.toThrow()
  })
  it('does nothing when the browser refuses to create the context', () => {
    expect(() => playVictorySound(() => { throw new Error('blocked') })).not.toThrow()
  })
  it('plays a clack, a creak and a moan, then releases the audio context', () => {
    const { ctx, close, oscillators } = fakeContext()
    playVictorySound(() => ctx)
    const types = oscillators.filter((o) => o.start.mock.calls.length > 0).map((o) => o.type)
    expect(types).toEqual(expect.arrayContaining(['square', 'sawtooth', 'sine']))
    oscillators.find((o) => o.onended)?.onended?.()
    expect(close).toHaveBeenCalledOnce()
  })
  it('stays silent in jsdom with the default context', () => {
    expect(() => playVictorySound()).not.toThrow()
  })
})
