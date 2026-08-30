import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { BannerStep } from '@/@types/walk'
import { CLASS_PORTRAITS } from '@/constants/classes'
import { strings } from '@/constants/strings'
import { ignore } from '@/lib/utils'
import { pending } from '@/test-doubles'

const rust = {
  stepped: null as ((step: BannerStep) => void) | null
}

const bridge = {
  onBannerStep: vi.fn(),
  bannerStep: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { Banner } = await import('@/screens/banner-screen')

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

      return ignore
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

    expect(screen.queryByText(strings.walk.banner.waiting)).toBeNull()
  })

  it('dit seulement Déplacement rapide tant qu’on n’est arrivé sur personne', async () => {
    await posted(stepOf())

    expect(screen.getByText(strings.walk.banner.waiting)).not.toBeNull()
  })

  it('dit Aperçu le temps de montrer le coin choisi', async () => {
    await posted(stepOf({ previewing: true }))

    expect(screen.getByText(strings.walk.banner.previewing)).not.toBeNull()
    expect(screen.queryByText(strings.walk.banner.waiting)).toBeNull()
  })

  it('porte le pseudo du personnage sur lequel on vient d’arriver', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: 'iop', gender: 'male' } })
    )

    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(screen.queryByText(strings.walk.banner.waiting)).toBeNull()
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

  it('revient à Déplacement rapide quand on quitte le jeu', async () => {
    await posted(
      stepOf({ character: { nickname: 'Alpha', class: 'iop', gender: 'male' } })
    )

    step(stepOf())

    expect(screen.getByText(strings.walk.banner.waiting)).not.toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })
})
