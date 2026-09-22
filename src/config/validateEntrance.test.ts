/** @file Tests for the optional entrance section. */
import { validateEntrance } from './validateEntrance'

function run(raw: unknown) {
  const errors: string[] = []
  return { entrance: validateEntrance(raw, errors), errors }
}
const valid = { titre: 'Une lettre', message: 'Entrez si vous osez.', type_reponse: 'mots', reponse: 'Fantôme' }

describe('validateEntrance', () => {
  it('is undefined when the section is absent', () => {
    expect(run(undefined)).toEqual({ entrance: undefined, errors: [] })
  })
  it('maps a valid entrance', () => {
    expect(run(valid).entrance).toEqual({
      title: 'Une lettre', message: 'Entrez si vous osez.', answer: { kind: 'letters', value: 'Fantôme' },
    })
  })
  it('leaves out a missing title', () => {
    const { titre: _titre, ...rest } = valid
    expect(run(rest).entrance).toEqual({ message: 'Entrez si vous osez.', answer: { kind: 'letters', value: 'Fantôme' } })
  })
  it('collects every error at once', () => {
    const { entrance, errors } = run({ titre: '', message: 4, type_reponse: 'mots', reponse: '', mesage: 'x' })
    expect(entrance).toBeNull()
    expect(errors).toEqual([
      'entrée : « titre » doit être un texte non vide.',
      'entrée : « message » est obligatoire et doit être un texte non vide.',
      'entrée : « reponse » est obligatoire et doit être un texte non vide.',
      "entrée : « mesage » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object section', () => {
    expect(run('bonjour').errors).toEqual(['entrée : doit contenir « message », « type_reponse » et « reponse ».'])
  })
})
