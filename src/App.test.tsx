/** @file Smoke test for the root component. */
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('shows the quiz title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Quiz Halloween' })).toBeInTheDocument()
  })
})
