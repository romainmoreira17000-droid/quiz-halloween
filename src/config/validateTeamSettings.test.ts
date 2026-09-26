/** @file Tests for the team settings: team names, slot length and animator code. */
import { validateTeamSettings } from './validateTeamSettings'

const valid = { equipes: ['Sorcières', 'Zombies'], duree_epreuve_minutes: 15, code_animateur: '2710' }

function run(raw: Record<string, unknown>, stepCount: number | null = 2) {
  const errors: string[] = []
  const settings = validateTeamSettings(raw, stepCount, errors)
  return { settings, errors }
}

describe('validateTeamSettings', () => {
  it('returns the settings', () => {
    expect(run(valid)).toEqual({
      settings: { teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710' }, errors: [],
    })
  })
  it('trims team names', () => {
    expect(run({ ...valid, equipes: [' Sorcières ', 'Zombies'] }).settings?.teams).toEqual(['Sorcières', 'Zombies'])
  })
  it('requires the team list', () => {
    const raw: Record<string, unknown> = { ...valid }
    delete raw.equipes
    expect(run(raw).errors).toEqual(['« equipes » est obligatoire et doit être une liste de noms.'])
  })
  it('rejects an empty team name', () => {
    expect(run({ ...valid, equipes: ['Sorcières', ' '] }).errors)
      .toEqual(["« equipes » : l'équipe n° 2 doit avoir un nom."])
  })
  it('rejects a name used twice', () => {
    expect(run({ ...valid, equipes: ['Zombies', ' Zombies'] }).errors)
      .toEqual(['« equipes » : « Zombies » apparaît plusieurs fois.'])
  })
  it('needs one team per step', () => {
    expect(run(valid, 3).errors)
      .toEqual(['« equipes » contient 2 équipe(s) alors que « nombre_etapes » vaut 3 : il faut une équipe par épreuve.'])
  })
  it('skips the count check without a valid step count', () => {
    expect(run(valid, null).errors).toEqual([])
  })
  it.each([0, -1, 2.5, '15', undefined])('rejects duree_epreuve_minutes %j', (duree_epreuve_minutes) => {
    expect(run({ ...valid, duree_epreuve_minutes }).errors)
      .toEqual(['« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it.each(['123', '123456789', '12a4', '', 2710, undefined])('rejects code_animateur %j', (code_animateur) => {
    expect(run({ ...valid, code_animateur }).errors).toEqual(['« code_animateur » doit contenir de 4 à 8 chiffres.'])
  })
  it('accepts an 8-digit code with a leading zero', () => {
    expect(run({ ...valid, code_animateur: '01234567' }).settings?.animatorCode).toBe('01234567')
  })
  it('explains that duree_minutes was replaced', () => {
    expect(run({ ...valid, duree_minutes: 90 }).errors)
      .toEqual(["« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes."])
  })
})
