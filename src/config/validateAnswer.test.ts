/** @file Tests for the answer part of a step or of the entrance. */
import { validateAnswer } from './validateAnswer'

function run(raw: Record<string, unknown>) {
  const errors: string[] = []
  return { answer: validateAnswer(raw, 'étape 2 : ', errors), errors }
}

describe('validateAnswer', () => {
  it('maps a digits answer', () => {
    expect(run({ type_reponse: 'chiffres', reponse: '0472' })).toEqual({ answer: { kind: 'digits', value: '0472' }, errors: [] })
  })
  it('accepts a YAML number as digits text', () => {
    expect(run({ type_reponse: 'chiffres', reponse: 1832 }).answer).toEqual({ kind: 'digits', value: '1832' })
  })
  it('maps a letters answer with accents, spaces and apostrophes, trimmed', () => {
    expect(run({ type_reponse: 'mots', reponse: " Toile d'araignée " }).answer)
      .toEqual({ kind: 'letters', value: "Toile d'araignée" })
  })
  it.each(['lettres', 3, undefined, 'toString'])('rejects type_reponse %j', (type_reponse) => {
    expect(run({ type_reponse, reponse: 'x' }).errors)
      .toEqual(['étape 2 : « type_reponse » doit valoir « chiffres » ou « mots ».'])
  })
  it.each(['', '   ', undefined, true])('rejects reponse %j', (reponse) => {
    expect(run({ type_reponse: 'mots', reponse }).errors)
      .toEqual(['étape 2 : « reponse » est obligatoire et doit être un texte non vide.'])
  })
  it.each(['12a', '1 2', '1234567890123', -4])('rejects digits reponse %j', (reponse) => {
    expect(run({ type_reponse: 'chiffres', reponse }).errors)
      .toEqual(['étape 2 : « reponse » doit contenir uniquement des chiffres (12 au plus).'])
  })
  it.each(['R2D2', 'ŒUF', 'oui!'])('rejects letters that the keyboard cannot type: %j', (reponse) => {
    expect(run({ type_reponse: 'mots', reponse }).errors)
      .toEqual(['étape 2 : « reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.'])
  })
  it('rejects letters longer than 24 characters', () => {
    expect(run({ type_reponse: 'mots', reponse: 'A'.repeat(25) }).errors)
      .toEqual(['étape 2 : « reponse » doit faire 24 caractères au plus.'])
  })
  it('reports type and reponse together', () => {
    expect(run({}).errors).toEqual([
      'étape 2 : « type_reponse » doit valoir « chiffres » ou « mots ».',
      'étape 2 : « reponse » est obligatoire et doit être un texte non vide.',
    ])
  })
})
