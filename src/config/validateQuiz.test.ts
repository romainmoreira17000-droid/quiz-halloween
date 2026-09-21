/** @file Tests for whole-quiz validation (count consistency, required fields, typos). */
import { validateQuiz } from './validateQuiz'

function step(n: number) {
  return { titre: `Étape ${n}`, consigne: `Consigne ${n}`, solution: n % 10 }
}
function steps(count: number) {
  return Array.from({ length: count }, (_, i) => step(i + 1))
}
function validRaw(count = 6): Record<string, unknown> {
  return { titre: 'Le manoir hanté', duree_minutes: 90, nombre_etapes: count, etapes: steps(count) }
}
function errorsOf(raw: unknown): string[] {
  const result = validateQuiz(raw)
  return result.ok ? [] : result.errors
}

describe('validateQuiz', () => {
  it('returns a typed config for a valid quiz', () => {
    const result = validateQuiz({ ...validRaw(), intro: 'Bienvenue', cadenas: { indice: 'Chut' } })
    expect(result).toEqual({ ok: true, config: {
      title: 'Le manoir hanté', intro: 'Bienvenue', durationMinutes: 90, stepCount: 6,
      steps: [1, 2, 3, 4, 5, 6].map((n) => ({ title: `Étape ${n}`, instruction: `Consigne ${n}`, solution: n })),
      padlock: { order: [1, 2, 3, 4, 5, 6], hint: 'Chut' },
    } })
  })
  it('rejects fewer steps than nombre_etapes', () => {
    expect(errorsOf({ ...validRaw(), etapes: steps(5) }))
      .toEqual(['« etapes » contient 5 étape(s) alors que « nombre_etapes » vaut 6.'])
  })
  it('rejects more steps than nombre_etapes', () => {
    expect(errorsOf({ ...validRaw(), etapes: steps(7) }))
      .toEqual(['« etapes » contient 7 étape(s) alors que « nombre_etapes » vaut 6.'])
  })
  it.each([0, -5, 1.5, '90'])('rejects duree_minutes %j', (duree_minutes) => {
    expect(errorsOf({ ...validRaw(), duree_minutes }))
      .toEqual(['« duree_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it.each([0, 2.5, 'six'])('rejects nombre_etapes %j', (nombre_etapes) => {
    expect(errorsOf({ ...validRaw(), nombre_etapes }))
      .toContain('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')
  })
  it('rejects missing duree_minutes and nombre_etapes', () => {
    const raw = validRaw()
    delete raw.duree_minutes
    delete raw.nombre_etapes
    expect(errorsOf(raw)).toEqual([
      '« duree_minutes » doit être un nombre entier supérieur à 0.',
      '« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.',
    ])
  })
  it('accepts a single-step quiz', () => {
    expect(errorsOf(validRaw(1))).toEqual([])
  })
  it('collects errors from every level at once', () => {
    const raw = { ...validRaw(), titre: '', intro: 3, etapes: [...steps(5), { titre: 'x', consigne: 'y', solution: 12 }],
      cadenas: { ordre: [1, 1, 2, 3, 4, 5] }, extra: true }
    expect(errorsOf(raw)).toEqual([
      '« titre » est obligatoire et doit être un texte non vide.',
      '« intro » doit être un texte.',
      'étape 6 : « solution » doit être un chiffre entier entre 0 et 9.',
      "cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 6, une seule fois.",
      "« extra » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a missing etapes list', () => {
    const raw = validRaw()
    delete raw.etapes
    expect(errorsOf(raw)).toEqual(['« etapes » est obligatoire et doit être une liste.'])
  })
  it('rejects a non-object document', () => {
    expect(errorsOf('bonjour')).toEqual(['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'])
  })
})
