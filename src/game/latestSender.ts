/** @file Sends one value at a time, the latest waiting one next: an old state answered late never overwrites a newer one. */

/**
 * Wraps a send so calls never overlap.
 * @param send Sends one value; must not reject.
 * @returns A function to call with each new value; values replaced while a send runs are dropped.
 */
export function createLatestSender<T>(send: (value: T) => Promise<void>): (value: T) => void {
  let busy = false
  let waiting: { value: T } | null = null
  const run = (value: T) => {
    busy = true
    void send(value).catch(() => {}).finally(() => {
      busy = false
      const next = waiting
      waiting = null
      if (next) run(next.value)
    })
  }
  return (value) => {
    if (busy) waiting = { value }
    else run(value)
  }
}
