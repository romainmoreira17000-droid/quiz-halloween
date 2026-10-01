/** @file Tests for the game settings: team names, slot length, hint delay, block time and animator code. */
import { validateTeamSettings } from './validateTeamSettings'

const valid = {
  equipes: ['Sorcières', 'Zombies'], duree_epreuve_minutes: 15, indices_apres_minutes: [5, 8, 11], blocage_secondes: 60, code_animateur: '2710',
}

function run(raw: Record<string, unknown>, stepCount: number | null = 2) {
  const errors: string[] = []
  const settings = validateTeamSettings(raw, stepCount, errors)
  return { settings, errors }
}

describe('validateTeamSettings', () => {
  it('returns the settings', () => {
    expect(run(valid)).toEqual({
      settings: { teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [5, 8, 11], blockSeconds: 60, animatorCode: '2710' },
      errors: [],
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
  it('needs at least one team per rotating challenge', () => {
    expect(run(valid, 3).errors)
      .toEqual(["« equipes » contient 2 équipe(s) alors qu'il y a 3 épreuve(s) en rotation : il faut au moins une équipe par épreuve."])
  })
  it('lets several teams share a post', () => {
    expect(run(valid, 1).errors).toEqual([])
  })
  it('accepts any team count when only the final is left', () => {
    expect(run(valid, 0).errors).toEqual([])
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
  it.each([[[0]], [[5, 8, 11]], [[14]]])('accepts indices_apres_minutes %j', (indices_apres_minutes) => {
    expect(run({ ...valid, indices_apres_minutes }).errors).toEqual([])
  })
  it.each([[[]], [10], [[-1]], [[2.5]], [['5']], [undefined]])('rejects indices_apres_minutes %j', (indices_apres_minutes) => {
    expect(run({ ...valid, indices_apres_minutes }).errors)
      .toEqual(['« indices_apres_minutes » doit être une liste de nombres entiers, 0 ou plus (exemple : [5, 8, 11]).'])
  })
  it.each([[[8, 5]], [[5, 5]]])('needs increasing times %j', (indices_apres_minutes) => {
    expect(run({ ...valid, indices_apres_minutes }).errors)
      .toEqual(['« indices_apres_minutes » : les minutes doivent aller en croissant, sans doublon (exemple : [5, 8, 11]).'])
  })
  it('needs every hint before the end of the slot', () => {
    expect(run({ ...valid, indices_apres_minutes: [5, 15] }).errors)
      .toEqual(["« indices_apres_minutes » : 15 doit être plus petit que « duree_epreuve_minutes » (15) : sinon l'indice n'arrive jamais."])
  })
  it('skips the hint-vs-slot check when the slot length is wrong', () => {
    expect(run({ ...valid, duree_epreuve_minutes: 0, indices_apres_minutes: [20] }).errors)
      .toEqual(['« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it('explains the old single hint delay', () => {
    const { indices_apres_minutes: _dropped, ...old } = valid
    expect(run({ ...old, indice_apres_minutes: 10 }).errors).toContain(
      '« indice_apres_minutes » a été remplacée par « indices_apres_minutes » : une liste de minutes, une par indice (exemple : [5, 8, 11]).')
  })
  it('accepts blocage_secondes 0 (no block)', () => {
    expect(run({ ...valid, blocage_secondes: 0 }).settings?.blockSeconds).toBe(0)
  })
  it.each([-1, 1.5, '60', undefined])('rejects blocage_secondes %j', (blocage_secondes) => {
    expect(run({ ...valid, blocage_secondes }).errors)
      .toEqual(['« blocage_secondes » doit être un nombre entier supérieur ou égal à 0 (0 = pas de blocage).'])
  })
})
