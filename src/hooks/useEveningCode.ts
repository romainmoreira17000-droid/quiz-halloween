/** @file Evening code of the remote board on this device: read once, changed by an animator. */
import { useState } from 'react'
import { loadEveningCode, saveEveningCode } from '../services/savedEveningCode'

/**
 * Holds the evening code of this device.
 * @returns The code (null when none) and a setter that saves it (empty turns it off).
 */
export function useEveningCode(): [string | null, (code: string) => void] {
  const [code, setCode] = useState(loadEveningCode)
  const change = (next: string) => {
    saveEveningCode(next)
    setCode(loadEveningCode())
  }
  return [code, change]
}
