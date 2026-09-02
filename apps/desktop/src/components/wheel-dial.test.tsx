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

describe('la roue dessinée', () => {
  it('découpe le disque en autant de camemberts que de personnages', () => {
    expect(slicesOf(draw())).toHaveLength(3)
  })

  it('donne le disque entier au seul personnage connecté', () => {
    const container = draw({ slices: [TEAM[0]] })

    expect(slicesOf(container)).toHaveLength(1)
    expect(slicesOf(container)[0].getAttribute('fill-rule')).toBe('evenodd')
  })

  it('écrit le pseudo sous chaque tête', () => {
    expect(namesOf(draw())).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('peint plus foncé la part de la fenêtre où l’on est', () => {
    const marked = slicesOf(draw()).map((slice) => {
      return slice.hasAttribute('data-here')
    })

    expect(marked).toStrictEqual([true, false, false])
  })

  it('teinte la part du personnage de sa couleur, et laisse l’ambre aux autres', () => {
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

  it('teinte chaque part dès le repos, sans rien attendre du survol', () => {
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

  it('pose la tête de la fenêtre du dessus au centre', () => {
    const faces = draw().querySelectorAll('.wheel-face img')

    expect(faces).toHaveLength(1)
  })

  it('laisse le centre vide quand on n’est sur personne', () => {
    const container = draw({
      slices: [wheelSliceOf({ nickname: 'Alpha' })]
    })

    expect(container.querySelectorAll('.wheel-face img')).toHaveLength(0)
  })

  it('allume la part visée, et elle seule', () => {
    const lit = slicesOf(draw({ hovered: 2 })).map((slice) => {
      return slice.hasAttribute('data-hovered')
    })

    expect(lit).toStrictEqual([false, false, true])
  })

  it('ne dit rien au centre tant qu’il reste un personnage', () => {
    expect(draw({ nobody: 'Personne' }).querySelector('p')).toBeNull()
  })

  it('dit au centre qu’il n’y a personne quand la roue est vide', () => {
    const container = draw({ slices: [], nobody: 'Personne de connecté' })

    expect(container.querySelector('p')?.textContent).toBe(
      'Personne de connecté'
    )
  })

  it('vise la part que la souris touche, et lâche en sortant', () => {
    const aimed = vi.fn()
    const container = draw({ onAim: aimed })

    fireEvent.pointerEnter(slicesOf(container)[1])

    expect(aimed).toHaveBeenCalledWith(1)

    const [svg] = container.querySelectorAll('svg')

    fireEvent.pointerLeave(svg)

    expect(aimed).toHaveBeenCalledWith(null)
  })

  it('éclaire le pseudo de la part visée, et lui seul', () => {
    const container = draw({ hovered: 1 })
    const names = [...container.querySelectorAll('.wheel-name')]

    expect(names[1].hasAttribute('data-hovered')).toBe(true)
    expect(names[0].hasAttribute('data-hovered')).toBe(false)
  })

  it('fait grandir tout le disque avec la jauge', () => {
    const small = headWidthOf(draw({ diameter: 280 }))
    const wide = headWidthOf(draw({ diameter: 720 }))

    expect(small).toBeGreaterThan(0)
    expect(wide / small).toBeCloseTo(720 / 280, 1)
  })

  it('resserre les têtes quand toute l’équipe est là', () => {
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
