/** @file Tests for the bone-and-web ornaments of the Halloween padlocks. */
import { render } from '@testing-library/react'
import { Bone, Cobweb, Keyhole, Skull } from './Ornaments'

describe('Bone', () => {
  it('draws a shaft with two knobs at each end', () => {
    const { container } = render(<svg><Bone x={40} y={100} length={50} /></svg>)
    const bone = container.querySelector('g.lock-bone')
    expect(bone?.querySelector('rect')).toHaveAttribute('height', '50')
    const knobs = [...(bone?.querySelectorAll('circle') ?? [])].map((c) => c.getAttribute('cy'))
    expect(knobs).toEqual(['100', '100', '150', '150'])
  })
})

describe('Skull', () => {
  it('has two eyes that can turn red', () => {
    const { container } = render(<svg><Skull cx={150} cy={240} r={8} /></svg>)
    expect(container.querySelectorAll('g.lock-skull .lock-eye.lock-eye--skull')).toHaveLength(2)
  })
})

describe('Cobweb', () => {
  it('spins four threads and three rings from its corner', () => {
    const { container } = render(<svg><Cobweb x={36} y={102} size={24} /></svg>)
    const web = container.querySelector('g.lock-cobweb')
    expect(web).toHaveAttribute('transform', 'translate(36 102) scale(1 1)')
    expect(web?.querySelectorAll('line')).toHaveLength(4)
    expect(web?.querySelectorAll('polyline')).toHaveLength(3)
  })
  it('mirrors itself for the right-hand corner', () => {
    const { container } = render(<svg><Cobweb x={264} y={102} size={24} flip /></svg>)
    expect(container.querySelector('g.lock-cobweb')).toHaveAttribute('transform', 'translate(264 102) scale(-1 1)')
  })
})

describe('Keyhole', () => {
  it('draws a glowing keyhole', () => {
    const { container } = render(<svg><Keyhole cx={150} cy={232} /></svg>)
    expect(container.querySelector('path.lock-keyhole')).toHaveAttribute('d', expect.stringMatching(/^M150 227 /))
  })
})
