/** @file Tests for whole-quiz validation (count consistency, required fields, typos). */
import { validateQuiz } from './validateQuiz'

function step(n: number) {
  return { titre: `Étape ${n}`, consigne: `Consigne ${n}`, type_reponse: 'chiffres', reponse: String(n), chiffre: n % 10 }
}
function steps(count: number) {
  return Array.from({ length: count }, (_, i) => step(i + 1))
}
function teams(count: number) {
  return Array.from({ length: count }, (_, i) => `Équipe ${i + 1}`)
}
function validRaw(count = 6): Record<string, unknown> {
  return { titre: 'Le manoir hanté', equipes: teams(count), duree_epreuve_minutes: 15, indice_apres_minutes: 10, blocage_secondes: 60, code_animateur: '2710', nombre_etapes: count, etapes: steps(count) }
}
function errorsOf(raw: unknown): string[] {
  const result = validateQuiz(raw)
  return result.ok ? [] : result.errors
}

describe('validateQuiz', () => {
  it('returns a typed config for a valid quiz', () => {
    const result = validateQuiz({ ...validRaw(), intro: 'Bienvenue', cadenas: { indice: 'Chut' } })
    expect(result).toEqual({ ok: true, config: {
      title: 'Le manoir hanté', intro: 'Bienvenue', teams: teams(6), slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 60, animatorCode: '2710', stepCount: 6,
      steps: [1, 2, 3, 4, 5, 6].map((n) => ({ title: `Étape ${n}`, instruction: `Consigne ${n}`, answer: { kind: 'digits', value: String(n) }, digit: n })),
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
  it.each([0, 2.5, 'six'])('rejects nombre_etapes %j', (nombre_etapes) => {
    expect(errorsOf({ ...validRaw(), nombre_etapes }))
      .toContain('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')
  })
  it('rejects a missing nombre_etapes without complaining about the team count', () => {
    const raw = validRaw()
    delete raw.nombre_etapes
    expect(errorsOf(raw)).toEqual(['« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.'])
  })
  it('requires the team settings', () => {
    const raw = validRaw()
    delete raw.equipes
    delete raw.duree_epreuve_minutes
    delete raw.code_animateur
    expect(errorsOf(raw)).toEqual([
      '« equipes » est obligatoire et doit être une liste de noms.',
      '« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.',
      '« code_animateur » doit contenir de 4 à 8 chiffres.',
    ])
  })
  it('explains duree_minutes once, without calling it unknown', () => {
    expect(errorsOf({ ...validRaw(), duree_minutes: 90 }))
      .toEqual(["« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes."])
  })
  it('accepts a single-step quiz', () => {
    expect(errorsOf(validRaw(1))).toEqual([])
  })
  it('collects errors from every level at once', () => {
    const raw = { ...validRaw(), titre: '', intro: 3, entree: 'x',
      etapes: [...steps(5), { titre: 'x', consigne: 'y', type_reponse: 'chiffres', reponse: '1', chiffre: 12 }],
      cadenas: { ordre: [1, 1, 2, 3, 4, 5] }, extra: true }
    expect(errorsOf(raw)).toEqual([
      '« titre » est obligatoire et doit être un texte non vide.',
      '« intro » doit être un texte.',
      'entrée : doit contenir « message », « type_reponse » et « reponse ».',
      'étape 6 : « chiffre » doit être un chiffre entier entre 0 et 9.',
      "cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 6, une seule fois.",
      "« extra » n'est pas un paramètre connu.",
    ])
  })
  it('adds the entrance to the config', () => {
    const entree = { message: 'Entrez.', type_reponse: 'mots', reponse: 'Fantôme' }
    const result = validateQuiz({ ...validRaw(), entree })
    expect(result.ok && result.config.entrance)
      .toEqual({ message: 'Entrez.', answer: { kind: 'letters', value: 'Fantôme' } })
  })
  it('has no entrance when the section is absent', () => {
    const result = validateQuiz(validRaw())
    expect(result.ok && 'entrance' in result.config).toBe(false)
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
