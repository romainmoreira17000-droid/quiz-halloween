/** @file Tests for the restaurant front backdrop. */
import { render } from '@testing-library/react'
import { RestaurantFront } from './RestaurantFront'

describe('RestaurantFront', () => {
  it('draws the restaurant door as pure decoration, with lit lanterns', () => {
    const { container } = render(<RestaurantFront />)
    const svg = container.querySelector('svg.restaurant-front')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.querySelectorAll('.hall-flame').length).toBeGreaterThanOrEqual(2)
    expect(svg?.querySelector('.restaurant-door')).not.toBeNull()
  })
})
