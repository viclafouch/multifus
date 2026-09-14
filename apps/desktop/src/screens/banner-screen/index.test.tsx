import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { BannerStep } from '@/@types/walk'
import { CLASS_PORTRAITS } from '@/constants/classes'
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

describe('the banner', () => {
  beforeEach(() => {
    rust.stepped = null
  })

  it('does not show itself while Rust has laid nothing', async () => {
    bridge.onBannerStep.mockImplementation(pending)
    bridge.bannerStep.mockImplementation(pending)

    render(<Banner />)

    expect(screen.queryByText('Déplacement rapide')).toBeNull()
  })

  it('says only the Quick move name while nobody has been reached', async () => {
    await posted(stepOf())

    expect(screen.getByText('Déplacement rapide')).not.toBeNull()
  })

  it('says it is a preview while showing the chosen corner', async () => {
    await posted(stepOf({ previewing: true }))

    expect(screen.getByText('Aperçu')).not.toBeNull()
    expect(screen.queryByText('Déplacement rapide')).toBeNull()
  })

  it('carries the nickname of the character just reached', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'iop',
          gender: 'male',
          color: null
        }
      })
    )

    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(screen.queryByText('Déplacement rapide')).toBeNull()
  })

  it('carries the rim of the character color', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'iop',
          gender: 'male',
          color: 'sky'
        }
      })
    )

    expect(document.querySelector('.stripe')?.classList).toContain('tint-sky')
  })

  it('carries no rim for a character without a color', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'iop',
          gender: 'male',
          color: null
        }
      })
    )

    expect(document.querySelector('.stripe')).toBeNull()
  })

  it('carries the class head of the character', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'cra',
          gender: 'female',
          color: null
        }
      })
    )

    expect(portrait()).toBe(CLASS_PORTRAITS.cra.female)
  })

  it('carries the nickname even without a class nor a gender', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: null,
          gender: null,
          color: null
        }
      })
    )

    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(portrait()).toBeNull()
  })

  it('follows the next step', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'iop',
          gender: 'male',
          color: null
        }
      })
    )

    step(
      stepOf({
        character: {
          nickname: 'Bravo',
          class: 'iop',
          gender: 'male',
          color: null
        }
      })
    )

    expect(screen.getByText('Bravo')).not.toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })

  it('goes back to the Quick move name when the game is left', async () => {
    await posted(
      stepOf({
        character: {
          nickname: 'Alpha',
          class: 'iop',
          gender: 'male',
          color: null
        }
      })
    )

    step(stepOf())

    expect(screen.getByText('Déplacement rapide')).not.toBeNull()
    expect(screen.queryByText('Alpha')).toBeNull()
  })
})
