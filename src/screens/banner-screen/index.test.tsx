import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { BannerCorner, BannerStep } from '@/@types/walk'
import { CLASS_PORTRAITS } from '@/constants/classes'
import { strings } from '@/constants/strings'

function pending(): Promise<never> {
  return new Promise(() => {})
}

const rust = vi.hoisted(() => {
  return { stepped: null as ((step: BannerStep) => void) | null }
})

const bridge = vi.hoisted(() => {
  return {
    onBannerStep: vi.fn(),
    bannerStep: vi.fn()
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { Banner } = await import('@/screens/banner-screen')

const unlisten = () => {}

const words = strings.walk.banner

const stepOf = (fields: Partial<BannerStep> = {}): BannerStep => {
  return {
    corner: 'bottomRight',
    character: null,
    previewing: false,
    ...fields
  }
}

const posted = async (first: BannerStep | null) => {
  bridge.onBannerStep.mockImplementation(
    async (handle: (step: BannerStep) => void) => {
      rust.stepped = handle

      return unlisten
    }
  )
  bridge.bannerStep.mockImplementation(async () => {
    return first
  })

  render(<Banner />)

  await act(async () => {
    await Promise.resolve()
  })
}

const step = (next: BannerStep) => {
  act(() => {
    rust.stepped?.(next)
  })
}

const pill = () => {
  return document.querySelector('[data-from]')
}

const portrait = () => {
  return document.querySelector('img')?.getAttribute('src') ?? null
}

describe('la bannière', () => {
  beforeEach(() => {
    rust.stepped = null
  })

  it('ne se montre pas tant que Rust n’a rien posé', async () => {
    bridge.onBannerStep.mockImplementation(pending)
    bridge.bannerStep.mockImplementation(pending)

    render(<Banner />)

    expect(screen.queryByText(words.waiting)).toBeNull()
  })

  it('dit seulement Déplacement tant qu’on n’est arrivé sur personne', async () => {
    await posted(stepOf())

    expect(screen.getByText(words.waiting)).not.toBeNull()
  })

  it('dit Aperçu le temps de montrer le coin choisi', async () => {
    await posted(stepOf({ previewing: true }))

    expect(screen.getByText(words.previewing)).not.toBeNull()
    expect(screen.queryByText(words.waiting)).toBeNull()
  })

  it('porte le pseudo du personnage sur lequel on vient d’arriver', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: 'iop', gender: 'male' } })
    )

    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(screen.queryByText(words.waiting)).toBeNull()
  })

  it('porte la tête de classe du personnage', async () => {
    await posted(
      stepOf({
        character: { nickname: 'Alpha', class: 'cra', gender: 'female' }
      })
    )

    expect(portrait()).toBe(CLASS_PORTRAITS.cra.female)
  })

  it('porte le pseudo même sans classe ni sexe', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: null, gender: null } })
    )

    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(portrait()).toBeNull()
  })

  it('suit le pas suivant', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: 'iop', gender: 'male' } })
    )

    step(
      stepOf({ character: { nickname: 'Bravo', class: 'iop', gender: 'male' } })
    )

    expect(screen.getByText('Bravo')).not.toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })

  it('revient à Déplacement quand on quitte le jeu', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: 'iop', gender: 'male' } })
    )

    step(stepOf())

    expect(screen.getByText(words.waiting)).not.toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })

  it('glisse depuis le bord du coin où elle est posée', async () => {
    const arrivals = [
      { corner: 'topLeft', from: 'left' },
      { corner: 'bottomLeft', from: 'left' },
      { corner: 'topRight', from: 'right' },
      { corner: 'bottomRight', from: 'right' }
    ] as const satisfies readonly {
      readonly corner: BannerCorner
      readonly from: string
    }[]

    await posted(
      stepOf({
        corner: 'topLeft',
        character: { nickname: 'Alpha', class: 'iop', gender: 'male' }
      })
    )

    for (const arrival of arrivals) {
      step(
        stepOf({
          corner: arrival.corner,
          character: { nickname: 'Alpha', class: 'iop', gender: 'male' }
        })
      )

      expect(pill()?.getAttribute('data-from')).toBe(arrival.from)
    }
  })
})
