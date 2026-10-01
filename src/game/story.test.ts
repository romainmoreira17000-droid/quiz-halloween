/** @file Tests for the story told on the padlock screen. */
import type { QuizStep } from '../config/types'
import { finalStory } from './story'

const step = (story?: string): QuizStep => ({
  title: 'T', instruction: 'i', answer: { kind: 'digits', value: '1' }, digit: 1, ...(story && { story }),
})

describe('finalStory', () => {
  it('is the story of the final', () => {
    expect(finalStory({ steps: [step('Avant.'), step('Les masques tombent.')], finalStep: 1 })).toBe('Les masques tombent.')
  })
  it('is absent when the final has no story', () => {
    expect(finalStory({ steps: [step('Avant.'), step()], finalStep: 1 })).toBeUndefined()
  })
  it('is absent without a final, even if the last step has a story', () => {
    expect(finalStory({ steps: [step('Avant.'), step('Dernière.')] })).toBeUndefined()
  })
})
