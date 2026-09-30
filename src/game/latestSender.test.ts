/** @file Tests for the one-at-a-time sender where the latest value wins. */
import { createLatestSender } from './latestSender'

describe('createLatestSender', () => {
  it('sends one value at a time, then only the latest one waiting', async () => {
    const sent: number[] = []
    let finish: () => void = () => {}
    const send = createLatestSender<number>((value) => {
      sent.push(value)
      return new Promise((resolve) => { finish = resolve })
    })
    send(1)
    send(2)
    send(3)
    expect(sent).toEqual([1])
    finish()
    await vi.waitFor(() => expect(sent).toEqual([1, 3]))
    finish()
    send(4)
    await vi.waitFor(() => expect(sent).toEqual([1, 3, 4]))
  })
})
