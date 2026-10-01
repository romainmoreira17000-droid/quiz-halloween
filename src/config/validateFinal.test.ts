/** @file Tests for the `finale` flag of the steps. */
import { validateFinal } from './validateFinal'

const step = (extra: Record<string, unknown> = {}) => ({ titre: 'T', ...extra })
function run(steps: unknown) {
  const errors: string[] = []
  return { final: validateFinal(steps, errors), errors }
}

describe('validateFinal', () => {
  it('finds no final by default', () => {
    expect(run([step(), step()])).toEqual({ final: undefined, errors: [] })
  })
  it('returns the 0-based final step', () => {
    expect(run([step(), step({ finale: true }), step({ finale: false })])).toEqual({ final: 1, errors: [] })
  })
  it('rejects a non boolean flag', () => {
    expect(run([step({ finale: 'oui' })]).errors).toEqual(['étape 1 : « finale » doit valoir true ou false.'])
  })
  it('rejects several finals', () => {
    expect(run([step({ finale: true }), step(), step({ finale: true }), step({ finale: true })]))
      .toEqual({ final: undefined, errors: ['« finale » : une seule étape peut être la finale (étapes 1, 3 et 4).'] })
  })
  it('rejects hints on the final', () => {
    expect(run([step({ finale: true, indices: ['Regardez'] })]).errors)
      .toEqual(["étape 1 : la finale n'a pas d'indices (les animateurs les donnent)."])
  })
  it('ignores a list that is not a list (reported elsewhere)', () => {
    expect(run('rien')).toEqual({ final: undefined, errors: [] })
  })
})
