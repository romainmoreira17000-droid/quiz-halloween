/** @file Tests for padlock configuration validation. */
import { validatePadlock } from './validatePadlock'

function run(raw: unknown, stepCount = 4) {
  const errors: string[] = []
  return { padlock: validatePadlock(raw, stepCount, errors), errors }
}
const ORDER_ERROR = "cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 4, une seule fois."

describe('validatePadlock', () => {
  it('defaults to step order when absent', () => {
    expect(run(undefined).padlock).toEqual({ order: [1, 2, 3, 4] })
  })
  it('defaults the order when only a hint is given', () => {
    expect(run({ indice: 'La crypte en premier' }).padlock)
      .toEqual({ order: [1, 2, 3, 4], hint: 'La crypte en premier' })
  })
  it('accepts a permutation', () => {
    expect(run({ ordre: [3, 1, 4, 2] }).padlock).toEqual({ order: [3, 1, 4, 2] })
  })
  it.each([
    [[1, 2, 3]], [[1, 2, 3, 4, 1]], [[1, 1, 2, 3]], [[0, 1, 2, 3]], [[1, 2, 3, 5]], ['1234'],
  ])('rejects order %j', (ordre) => {
    expect(run({ ordre }).errors).toEqual([ORDER_ERROR])
  })
  it('rejects a non-text hint and unknown keys', () => {
    expect(run({ indice: 5, ordr: [1] }).errors).toEqual([
      'cadenas : « indice » doit être un texte.',
      "cadenas : « ordr » n'est pas un paramètre connu.",
    ])
  })
  it('reads the padlock title and victory message', () => {
    expect(run({ titre: 'La porte du restaurant', message_victoire: 'Entrez !' }).padlock)
      .toEqual({ order: [1, 2, 3, 4], title: 'La porte du restaurant', victoryMessage: 'Entrez !' })
  })
  it.each([[''], ['   '], [5]])('rejects title and victory message %j', (value) => {
    expect(run({ titre: value, message_victoire: value }).errors).toEqual([
      'cadenas : « titre » doit être un texte non vide.',
      'cadenas : « message_victoire » doit être un texte non vide.',
    ])
  })
  it('rejects a non-object padlock', () => {
    expect(run([1, 2]).errors)
      .toEqual(['« cadenas » doit contenir des paramètres : « ordre », « indice », « titre » ou « message_victoire ».'])
  })
})
