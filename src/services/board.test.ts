/** @file Tests for the remote board service: result of each call, never an exception. */
import { createBoardApi, type RpcClient } from './board'

const client = (answer: Awaited<ReturnType<RpcClient['rpc']>> | Error) => ({
  rpc: vi.fn(() => (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer))),
})

describe('createBoardApi', () => {
  it('sends the state with the parameter names of the SQL function', async () => {
    const fake = client({ data: null, error: null })
    expect(await createBoardApi(fake).push('CODE-123', 'Zombies', 'fp', { status: 'home' })).toBe('ok')
    expect(fake.rpc).toHaveBeenCalledWith('push_team_state', { p_code: 'CODE-123', p_team: 'Zombies', p_fingerprint: 'fp', p_state: { status: 'home' } })
  })
  it('tells a refused evening code from any other failure', async () => {
    expect(await createBoardApi(client({ data: null, error: { code: '28P01', message: 'invalid evening code' } })).push('x', 't', 'f', {})).toBe('refused')
    expect(await createBoardApi(client({ data: null, error: { code: '23514', message: 'check' } })).push('x', 't', 'f', {})).toBe('failed')
    expect(await createBoardApi(client(new TypeError('Failed to fetch'))).push('x', 't', 'f', {})).toBe('failed')
  })
  it('reads the board, stamped with the phone time', async () => {
    const fake = client({ data: { server_now: 10, teams: [] }, error: null })
    expect(await createBoardApi(fake, () => 99).read('CODE-123')).toEqual({ result: 'ok', snapshot: { serverNow: 10, receivedAt: 99, teams: [] } })
    expect(fake.rpc).toHaveBeenCalledWith('read_board', { p_code: 'CODE-123' })
  })
  it('counts an unreadable board as a failure', async () => {
    expect(await createBoardApi(client({ data: 'nope', error: null })).read('x')).toEqual({ result: 'failed', snapshot: null })
  })
  it('gives no snapshot when the read is refused or fails', async () => {
    expect(await createBoardApi(client({ data: null, error: { code: '28P01', message: 'invalid evening code' } })).read('x')).toEqual({ result: 'refused', snapshot: null })
    expect(await createBoardApi(client(new TypeError('Failed to fetch'))).read('x')).toEqual({ result: 'failed', snapshot: null })
  })
  it('never throws, even when the client throws at once', async () => {
    const throwing: RpcClient = { rpc: () => { throw new Error('boom') } }
    expect(await createBoardApi(throwing).reset('x')).toBe('failed')
  })
  it('resets the board', async () => {
    const fake = client({ data: null, error: null })
    expect(await createBoardApi(fake).reset('CODE-123')).toBe('ok')
    expect(fake.rpc).toHaveBeenCalledWith('reset_board', { p_code: 'CODE-123' })
  })
  it('is off without a client', async () => {
    const api = createBoardApi(null)
    expect(api.enabled).toBe(false)
    expect(await api.push('x', 't', 'f', {})).toBe('failed')
  })
})
