import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const motion = vi.hoisted(() => {
  return { isStill: false }
})

vi.mock(import('@/lib/motion'), () => {
  return {
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
    throw new Error(`${name} n’est pas sur le terrain`)
  }

  return place
}

describe('useGlide', () => {
  afterEach(() => {
    motion.isStill = false
  })

  it('sort du flux celui qui s’en va, à la place qu’il occupait', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('absolute')
  })

  it('laisse dans le flux ceux qui restent', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Alpha').style.position).toBe('')
    expect(placeOf(container, 'Charlie').style.position).toBe('')
  })

  it('remet dans le flux celui qui revient', () => {
    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)
    rerender(<Field going={[]} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('')
  })

  it('ne touche à rien quand le mouvement est refusé', () => {
    motion.isStill = true

    const { container, rerender } = render(<Field going={[]} />)

    rerender(<Field going={['Bravo']} />)

    expect(placeOf(container, 'Bravo').style.position).toBe('')
  })
})
