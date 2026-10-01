/** @file Tests for single-step validation. */
import { validateStep } from './validateStep'

const valid = { titre: 'La crypte', consigne: 'Comptez les chauves-souris.', type_reponse: 'chiffres', reponse: '13', chiffre: 4 }

function run(raw: unknown) {
  const errors: string[] = []
  return { step: validateStep(raw, 3, errors), errors }
}

describe('validateStep', () => {
  it('maps a valid step to English keys', () => {
    expect(run({ ...valid, image: 'crypte.png' }).step).toEqual({
      title: 'La crypte', instruction: 'Comptez les chauves-souris.', image: 'crypte.png',
      answer: { kind: 'digits', value: '13' }, digit: 4,
    })
  })
  it('maps fond to the room backdrop, and leaves it out when absent', () => {
    expect(run({ ...valid, fond: 'cimetiere.webp' }).step?.backdrop).toBe('cimetiere.webp')
    expect(run(valid).step).not.toHaveProperty('backdrop')
  })
  it('maps recit to the story, and leaves it out when absent', () => {
    expect(run({ ...valid, recit: 'Le fantôme soupire.' }).step?.story).toBe('Le fantôme soupire.')
    expect(run(valid).step).not.toHaveProperty('story')
  })
  it.each(['', '  ', 3])('rejects recit %j', (recit) => {
    expect(run({ ...valid, recit }).errors).toEqual(['étape 3 : « recit » doit être un texte non vide.'])
  })
  it('rejects an empty fond', () => {
    expect(run({ ...valid, fond: '' }).errors).toEqual(['étape 3 : « fond » doit être un nom de fichier.'])
  })
  it.each([0, 9])('accepts boundary chiffre %i', (chiffre) => {
    expect(run({ ...valid, chiffre }).errors).toEqual([])
  })
  it.each([10, -1, 4.5, '4', null, undefined])('rejects chiffre %s', (chiffre) => {
    expect(run({ ...valid, chiffre }).errors)
      .toEqual(['étape 3 : « chiffre » doit être un chiffre entier entre 0 et 9.'])
  })
  it('explains that solution was replaced', () => {
    expect(run({ ...valid, solution: 4 }).errors).toEqual([
      'étape 3 : « solution » a été remplacée par « reponse » (ce que tapent les enfants) et « chiffre » (le chiffre gagné).',
    ])
  })
  it('collects every error at once', () => {
    const { step, errors } = run({ titre: '', consigne: 12, type_reponse: 'mots', reponse: 'R2D2', chiffre: 'x', image: 3, chifre: 4 })
    expect(step).toBeNull()
    expect(errors).toEqual([
      'étape 3 : « titre » est obligatoire et doit être un texte non vide.',
      'étape 3 : « consigne » est obligatoire et doit être un texte non vide.',
      'étape 3 : « reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.',
      'étape 3 : « chiffre » doit être un chiffre entier entre 0 et 9.',
      'étape 3 : « image » doit être un nom de fichier.',
      "étape 3 : « chifre » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object step', () => {
    expect(run('coucou').errors)
      .toEqual(['étape 3 : doit contenir « titre », « consigne », « type_reponse », « reponse » et « chiffre ».'])
  })
  it('adds the hints when there are some', () => {
    expect(run({ ...valid, indices: ['Sous le chaudron.', 'Derrière'] }).step?.hints).toEqual(['Sous le chaudron.', 'Derrière'])
    expect(run(valid).step).not.toHaveProperty('hints')
    expect(run({ ...valid, indices: [] }).step).not.toHaveProperty('hints')
  })
  it.each([['Sous le chaudron.'], [['']], [['  ']], [[3]]])('rejects indices %j', (indices) => {
    expect(run({ ...valid, indices }).errors).toEqual(['étape 3 : « indices » doit être une liste de textes non vides.'])
  })
  it('explains the old single hint', () => {
    expect(run({ ...valid, indice: 'Sous le chaudron.' }).errors).toEqual([
      'étape 3 : « indice » a été remplacée par « indices », une liste (exemple : indices: ["premier indice", "deuxième indice"]).'])
  })
})
