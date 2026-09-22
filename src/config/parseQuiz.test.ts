/** @file Tests for YAML text parsing + validation. */
import { parseQuizYaml } from './parseQuiz'

describe('parseQuizYaml', () => {
  it('parses and validates a YAML document', () => {
    const text = 'titre: Test\nduree_minutes: 10\nnombre_etapes: 1\netapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "0"\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].digit).toBe(0)
  })
  it('reports unreadable YAML in French', () => {
    const result = parseQuizYaml('titre: [oups')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/^Le fichier YAML est illisible/)
  })
  it('keeps a leading zero from an unquoted numeric answer', () => {
    const text = 'titre: Test\nduree_minutes: 10\nnombre_etapes: 1\netapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: 0472\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].answer.value).toBe('0472')
  })
  it('still reads an unquoted numeric answer without a leading zero', () => {
    const text = 'titre: Test\nduree_minutes: 10\nnombre_etapes: 1\netapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: 1832\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].answer.value).toBe('1832')
  })
  it('reports an empty file', () => {
    expect(parseQuizYaml('')).toEqual({ ok: false,
      errors: ['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'] })
  })
})
