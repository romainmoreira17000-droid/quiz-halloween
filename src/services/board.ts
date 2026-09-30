/** @file The only door to the remote board (SQL functions push_team_state, read_board, reset_board). Never throws. */
import { parseBoard, type BoardSnapshot } from '../game/boardSnapshot'
import type { BoardCallResult } from '../game/syncStatus'
import { supabase } from './supabaseClient'

/** The part of the Supabase client used here, so tests can pass a fake. */
export interface RpcClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>
}

/** Calls to the remote board. */
export interface BoardApi {
  /** False when the build has no Supabase settings: nothing is ever sent. */
  enabled: boolean
  /** Sends a tablet's game (also its heartbeat). */
  push(code: string, team: string, fingerprint: string, state: unknown): Promise<BoardCallResult>
  /** Reads every team; the snapshot is null unless the result is 'ok'. */
  read(code: string): Promise<{ result: BoardCallResult; snapshot: BoardSnapshot | null }>
  /** « Nouvelle soirée »: empties the board. */
  reset(code: string): Promise<BoardCallResult>
}

/** SQLSTATE raised by the SQL functions for a wrong evening code (invalid_password). */
const REFUSED = '28P01'

/**
 * Builds the board calls on a Supabase client.
 * @param client Client, or null (remote board off).
 * @param clock Phone time, for the snapshot stamp.
 * @returns The calls; none of them ever throws.
 */
export function createBoardApi(client: RpcClient | null, clock: () => number = Date.now): BoardApi {
  const call = async (fn: string, args: Record<string, unknown>): Promise<{ result: BoardCallResult; data: unknown }> => {
    if (!client) return { result: 'failed', data: null }
    try {
      const { data, error } = await client.rpc(fn, args)
      if (!error) return { result: 'ok', data }
      return { result: error.code === REFUSED ? 'refused' : 'failed', data: null }
    } catch {
      // No network, DNS, CORS...: the game goes on, the next heartbeat retries.
      return { result: 'failed', data: null }
    }
  }
  return {
    enabled: client !== null,
    push: async (code, team, fingerprint, state) =>
      (await call('push_team_state', { p_code: code, p_team: team, p_fingerprint: fingerprint, p_state: state })).result,
    read: async (code) => {
      const { result, data } = await call('read_board', { p_code: code })
      const snapshot = result === 'ok' ? parseBoard(data, clock()) : null
      return result === 'ok' && !snapshot ? { result: 'failed', snapshot: null } : { result, snapshot }
    },
    reset: async (code) => (await call('reset_board', { p_code: code })).result,
  }
}

// A local const keeps the null check inside the arrow function (TypeScript does not narrow an import there).
const remote = supabase

/** Board calls of the app. */
export const boardApi = createBoardApi(remote && { rpc: (fn, args) => remote.rpc(fn, args) })
