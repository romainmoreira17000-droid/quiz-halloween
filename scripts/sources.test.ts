/** @file Tests for the choice of the source illustrations to convert. */
import { pickSourceImages } from './sources'

describe('pickSourceImages', () => {
  it('keeps PNG and JPEG files only', () => {
    expect(pickSourceImages(['a.png', 'b.JPG', 'c.jpeg', 'notes.txt'])).toEqual({ ok: true, files: ['a.png', 'b.JPG', 'c.jpeg'] })
  })
  it('explains where to put the images when the folder is missing', () => {
    const result = pickSourceImages(null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/dossier images-sources\/ est introuvable/)
  })
  it('says so when the folder has no image', () => {
    const result = pickSourceImages(['notes.txt'])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/aucune image PNG ou JPG/)
  })
})
