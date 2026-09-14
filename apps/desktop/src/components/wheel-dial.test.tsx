import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import type { WheelSlice } from '@/@types/wheel'
import { WheelDial } from '@/components/wheel-dial'
import { wheelSliceOf } from '@/test-doubles'

const DEAD_ZONE = 0.32

type DrawParams = {
  readonly slices?: readonly WheelSlice[]
  readonly hovered?: number | null
  readonly diameter?: number
  readonly nobody?: string
  readonly onAim?: (hovered: number | null) => void
}

const TEAM = [
  wheelSliceOf({ nickname: 'Alpha', here: true }),
  wheelSliceOf({ nickname: 'Bravo', class: 'cra', gender: 'female' }),
  wheelSliceOf({ nickname: 'Charlie', class: 'sram', gender: 'male' })
]

const draw = ({
  slices = TEAM,
  hovered = null,
  diameter = 400,
  nobody,
  onAim
}: DrawParams = {}) => {
  const { container } = render(
    <WheelDial
      diameter={diameter}
      deadZone={DEAD_ZONE}
      slices={slices}
      hovered={hovered}
      nobody={nobody}
      onAim={onAim}
    />
  )

  return container
}

const slicesOf = (container: HTMLElement) => {
  return [...container.querySelectorAll('.wheel-slice')]
}

const headWidthOf = (container: HTMLElement) => {
  const head = container.querySelector<HTMLElement>('.wheel-head')

  return Number(head?.style.width.replace('px', '') ?? '0')
}

const namesOf = (container: HTMLElement) => {
  return [...container.querySelectorAll('.wheel-name')].map((name) => {
    return name.textContent
  })
}

describe('the drawn wheel', () => {
  it('cuts the disc into as many slices as there are characters', () => {
    expect(slicesOf(draw())).toHaveLength(3)
  })

  it('gives the whole disc to the only online character', () => {
    const container = draw({ slices: [TEAM[0]] })

    expect(slicesOf(container)).toHaveLength(1)
    expect(slicesOf(container)[0].getAttribute('fill-rule')).toBe('evenodd')
  })

  it('writes the nickname under each head', () => {
    expect(namesOf(draw())).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('paints darker the slice of the window you are on', () => {
    const marked = slicesOf(draw()).map((slice) => {
      return slice.hasAttribute('data-here')
    })

    expect(marked).toStrictEqual([true, false, false])
  })

  it('tints the character slice with its color, and leaves the amber to the others', () => {
    const container = draw({
      slices: [
        wheelSliceOf({ nickname: 'Alpha', color: 'sky', here: true }),
        wheelSliceOf({ nickname: 'Bravo', color: 'pine' }),
        wheelSliceOf({ nickname: 'Charlie', color: null })
      ]
    })
    const slices = slicesOf(container)

    expect(slices[0].classList.contains('tint-sky')).toBe(true)
    expect(slices[1].classList.contains('tint-pine')).toBe(true)
    expect(
      [...slices[2].classList].some((name) => {
        return name.startsWith('tint-')
      })
    ).toBe(false)
  })

  it('tints each slice at rest already, without waiting for the hover', () => {
    const slices = slicesOf(
      draw({
        slices: [
          wheelSliceOf({ nickname: 'Alpha', color: 'sky' }),
          wheelSliceOf({ nickname: 'Bravo', color: 'pine' })
        ],
        hovered: null
      })
    )

    expect(
      slices.map((slice) => {
        return slice.hasAttribute('data-hovered')
      })
    ).toStrictEqual([false, false])
    expect(slices[0].classList.contains('tint-sky')).toBe(true)
    expect(slices[1].classList.contains('tint-pine')).toBe(true)
  })

  it('puts the head of the front window at the center', () => {
    const faces = draw().querySelectorAll('.wheel-face img')

    expect(faces).toHaveLength(1)
  })

  it('leaves the center empty when you are on nobody', () => {
    const container = draw({
      slices: [wheelSliceOf({ nickname: 'Alpha' })]
    })

    expect(container.querySelectorAll('.wheel-face img')).toHaveLength(0)
  })

  it('lights the aimed slice, and only it', () => {
    const lit = slicesOf(draw({ hovered: 2 })).map((slice) => {
      return slice.hasAttribute('data-hovered')
    })

    expect(lit).toStrictEqual([false, false, true])
  })

  it('says nothing at the center while one character is left', () => {
    expect(draw({ nobody: 'Personne' }).querySelector('p')).toBeNull()
  })

  it('says at the center that there is nobody when the wheel is empty', () => {
    const container = draw({ slices: [], nobody: 'Personne de connecté' })

    expect(container.querySelector('p')?.textContent).toBe(
      'Personne de connecté'
    )
  })

  it('aims at the slice the mouse touches, and lets go when it leaves', () => {
    const aimed = vi.fn()
    const container = draw({ onAim: aimed })

    fireEvent.pointerEnter(slicesOf(container)[1])

    expect(aimed).toHaveBeenCalledWith(1)

    const [svg] = container.querySelectorAll('svg')

    fireEvent.pointerLeave(svg)

    expect(aimed).toHaveBeenCalledWith(null)
  })

  it('lights the nickname of the aimed slice, and only it', () => {
    const container = draw({ hovered: 1 })
    const names = [...container.querySelectorAll('.wheel-name')]

    expect(names[1].hasAttribute('data-hovered')).toBe(true)
    expect(names[0].hasAttribute('data-hovered')).toBe(false)
  })

  it('grows the whole disc with the gauge', () => {
    const small = headWidthOf(draw({ diameter: 280 }))
    const wide = headWidthOf(draw({ diameter: 720 }))

    expect(small).toBeGreaterThan(0)
    expect(wide / small).toBeCloseTo(720 / 280, 1)
  })

  it('tightens the heads when the whole team is there', () => {
    const three = headWidthOf(draw())
    const eight = headWidthOf(
      draw({
        slices: Array.from({ length: 8 }, (_, rank) => {
          return wheelSliceOf({ nickname: `Membre ${rank}` })
        })
      })
    )

    expect(eight).toBeLessThan(three)
  })
})
