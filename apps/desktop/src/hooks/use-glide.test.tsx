import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const motion = vi.hoisted(() => {
  return { isStill: false }
})

vi.mock(import('@/lib/motion'), async (importOriginal) => {
  return {
    ...(await importOriginal()),
    matchIsStill: () => {
      return motion.isStill
    }
  }
})

const { useGlide } = await import('@/hooks/use-glide')

const NAMES = ['Alpha', 'Bravo', 'Charlie'] as const satisfies readonly string[]

type FieldProps = Readonly<{ going: readonly string[] }>

const Field = ({ going }: FieldProps) => {
  const holder = React.useRef<HTMLDivElement>(null)

  useGlide(holder, going.join('·'))

  return (
    <div ref={holder}>
      {NAMES.map((name) => {
        return (
          <span
            key={name}
            data-place={name}
            data-going={going.includes(name) ? '' : undefined}
          >
            {name}
          </span>
        )
      })}
    </div>
  )
}

const placeOf = (container: HTMLElement, name: string) => {
  const place = container.querySelector<HTMLElement>(`[data-place="${name}"]`)

  if (place === null) {
    throw new Error(`${name} is not on the field`)
  }

  return place
}

describe('useGlide', () => {
  afterEach(() => {
    motion.isStill = false
  })

  it('takes out of the flow the one who leaves, at the place it held', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('absolute')
  })

  it('leaves in the flow those who stay', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Alpha').style.position).toBe('')
    expect(placeOf(container, 'Charlie').style.position).toBe('')
  })

  it('puts back in the flow the one who comes back', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)
    rerender(<Field going={[]} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('')
  })

  it('touches nothing when the motion is refused', () => {
    motion.isStill = true

    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('')
  })
})
