/** @file Tests for single-step validation. */
import { validateStep } from './validateStep'

const valid = { titre: 'La crypte', consigne: 'Comptez les chauves-souris.', solution: 4 }

function run(raw: unknown) {
  const errors: string[] = []
  return { step: validateStep(raw, 3, errors), errors }
}

describe('validateStep', () => {
  it('maps a valid step to English keys', () => {
    expect(run({ ...valid, image: 'crypte.png' }).step).toEqual({
      title: 'La crypte', instruction: 'Comptez les chauves-souris.', image: 'crypte.png', solution: 4,
    })
  })
  it.each([0, 9])('accepts boundary solution %i', (solution) => {
    expect(run({ ...valid, solution }).errors).toEqual([])
  })
  it.each([10, -1, 4.5, '4', null])('rejects solution %s', (solution) => {
    expect(run({ ...valid, solution }).errors)
      .toEqual(['étape 3 : « solution » doit être un chiffre entier entre 0 et 9.'])
  })
  it('rejects a missing solution', () => {
    const { titre, consigne } = valid
    expect(run({ titre, consigne }).errors)
      .toEqual(['étape 3 : « solution » doit être un chiffre entier entre 0 et 9.'])
  })
  it('collects every error at once', () => {
    const { step, errors } = run({ titre: '', consigne: 12, solution: 'x', image: 3, solutions: 4 })
    expect(step).toBeNull()
    expect(errors).toEqual([
      'étape 3 : « titre » est obligatoire et doit être un texte non vide.',
      'étape 3 : « consigne » est obligatoire et doit être un texte non vide.',
      'étape 3 : « solution » doit être un chiffre entier entre 0 et 9.',
      'étape 3 : « image » doit être un nom de fichier.',
      "étape 3 : « solutions » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object step', () => {
    expect(run('coucou').errors).toEqual(['étape 3 : doit contenir « titre », « consigne » et « solution ».'])
  })
})
