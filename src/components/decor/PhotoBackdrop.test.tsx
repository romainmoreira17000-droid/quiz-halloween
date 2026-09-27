/** @file Tests for the photo backdrop. */
import { render } from '@testing-library/react'
import { PhotoBackdrop } from './PhotoBackdrop'

describe('PhotoBackdrop', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('shows the illustration under the site base path, as pure decoration', () => {
    vi.stubEnv('BASE_URL', '/quiz-halloween/')
    const { container } = render(<PhotoBackdrop file="cimetiere.webp" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('img')).toHaveAttribute('src', '/quiz-halloween/images/cimetiere.webp')
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })
})
