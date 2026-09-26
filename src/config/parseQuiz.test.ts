/** @file Tests for YAML text parsing + validation. */
import { parseQuizYaml } from './parseQuiz'

// Minimal valid root keys; each test appends `etapes`.
const HEAD = 'titre: Test\nequipes: [A]\nduree_epreuve_minutes: 10\nindice_apres_minutes: 5\nblocage_secondes: 60\ncode_animateur: "2710"\nnombre_etapes: 1\n'

describe('parseQuizYaml', () => {
  it('parses and validates a YAML document', () => {
    const text = HEAD + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "0"\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].digit).toBe(0)
  })
  it('reports unreadable YAML in French', () => {
    const result = parseQuizYaml('titre: [oups')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/^Le fichier YAML est illisible/)
  })
  it('keeps a leading zero from an unquoted numeric answer', () => {
    const text = HEAD + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: 0472\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].answer.value).toBe('0472')
  })
  it('still reads an unquoted numeric answer without a leading zero', () => {
    const text = HEAD + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: 1832\n    chiffre: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].answer.value).toBe('1832')
  })
  it('reports an empty file', () => {
    expect(parseQuizYaml('')).toEqual({ ok: false,
      errors: ['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'] })
  })
  it('keeps a leading zero from an unquoted animator code', () => {
    const text = HEAD.replace('code_animateur: "2710"', 'code_animateur: 0427')
      + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "1"\n    chiffre: 1\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.animatorCode).toBe('0427')
  })
})
