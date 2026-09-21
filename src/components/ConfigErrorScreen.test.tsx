/** @file Tests for the configuration error screen. */
import { render, screen } from '@testing-library/react'
import { ConfigErrorScreen } from './ConfigErrorScreen'

describe('ConfigErrorScreen', () => {
  it('renders one list item per error, in order', () => {
    render(<ConfigErrorScreen errors={['« titre » est obligatoire.', 'étape 3 : oups']} />)
    expect(screen.getAllByRole('listitem').map((li) => li.textContent))
      .toEqual(['« titre » est obligatoire.', 'étape 3 : oups'])
  })
  it('keeps duplicate messages', () => {
    render(<ConfigErrorScreen errors={['même erreur', 'même erreur']} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
