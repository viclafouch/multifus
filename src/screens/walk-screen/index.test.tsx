import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { BannerPlace, BannerScreen } from '@/@types/walk'
import { strings } from '@/constants/strings'

function pending(): Promise<never> {
  return new Promise(() => {})
}

const bridge = vi.hoisted(() => {
  return {
    setWalkEnabled: vi.fn(pending),
    setBannerCorner: vi.fn(pending),
    setBannerScreen: vi.fn(pending),
    bannerScreens: vi.fn()
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { WalkScreen } = await import('@/screens/walk-screen')

const words = strings.walk

const LAPTOP: BannerScreen = {
  name: 'Écran intégré',
  width: 1512,
  height: 982,
  primary: true
}

const TELEVISION: BannerScreen = {
  name: 'DELL U2720Q',
  width: 3840,
  height: 2160,
  primary: false
}

const walkShortcut = (accelerator: string | null): ShortcutBinding => {
  return {
    action: 'walk',
    accelerator,
    status: accelerator === null ? { kind: 'unbound' } : { kind: 'registered' },
    isDefault: true
  }
}

type ShowParams = {
  readonly enabled?: boolean
  readonly banner?: BannerPlace
  readonly shortcuts?: readonly ShortcutBinding[]
  readonly screens?: readonly BannerScreen[]
}

const show = async ({
  enabled = false,
  banner = { corner: 'bottomRight', screen: null },
  shortcuts = [],
  screens = [LAPTOP]
}: ShowParams = {}) => {
  bridge.bannerScreens.mockResolvedValue([...screens])

  render(
    <WalkScreen
      walk={{ enabled, banner }}
      shortcuts={shortcuts}
      run={() => {}}
    />
  )

  await screen.findByText(words.banner.hint)
}

const keyCaps = () => {
  return [...document.querySelectorAll('kbd')].map((cap) => {
    return cap.textContent
  })
}

const cornerNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const chipNamed = (rank: number) => {
  return screen.getByRole('button', {
    name: new RegExp(`^${words.banner.screenName(rank)}`, 'u')
  })
}

describe('l’écran du Déplacement', () => {
  it('allume le Déplacement quand on bouge l’interrupteur', async () => {
    await show({ enabled: false })

    fireEvent.click(screen.getByRole('switch', { name: words.switchLabel }))

    expect(bridge.setWalkEnabled).toHaveBeenCalledWith(true)
  })

  it('éteint le Déplacement quand on rebouge l’interrupteur', async () => {
    await show({ enabled: true })

    fireEvent.click(screen.getByRole('switch', { name: words.switchLabel }))

    expect(bridge.setWalkEnabled).toHaveBeenCalledWith(false)
  })

  it('rappelle qu’il démarre toujours éteint, et qu’il ne garde rien', async () => {
    await show()

    expect(screen.getByText(words.startsOff)).not.toBeNull()
    expect(screen.getByText(words.privacy)).not.toBeNull()
  })

  describe('le rappel du raccourci', () => {
    it('dessine les touches du raccourci du Déplacement', async () => {
      await show({ shortcuts: [walkShortcut('Control+Shift+KeyW')] })

      expect(keyCaps()).toStrictEqual(['Ctrl', 'Maj', 'W'])
    })

    it('dit qu’il n’y en a aucune tant que rien n’est posé', async () => {
      await show({ shortcuts: [walkShortcut(null)] })

      expect(screen.getByText(words.shortcutEmpty)).not.toBeNull()
      expect(keyCaps()).toStrictEqual([])
    })

    it('dit qu’il n’y en a aucune quand le Déplacement n’est pas dans la liste', async () => {
      await show({
        shortcuts: [
          {
            action: 'next',
            accelerator: 'Alt+KeyN',
            status: { kind: 'registered' },
            isDefault: true
          }
        ]
      })

      expect(screen.getByText(words.shortcutEmpty)).not.toBeNull()
    })
  })

  describe('le coin de la bannière', () => {
    it('offre les quatre coins', async () => {
      await show()

      for (const label of Object.values(words.banner.corners)) {
        expect(cornerNamed(label)).not.toBeNull()
      }
    })

    it('montre le coin en cours comme choisi, et lui seul', async () => {
      await show({ banner: { corner: 'topLeft', screen: null } })

      expect(
        cornerNamed(words.banner.corners.topLeft).getAttribute('aria-pressed')
      ).toBe('true')
      expect(
        cornerNamed(words.banner.corners.bottomRight).getAttribute(
          'aria-pressed'
        )
      ).toBe('false')
    })

    it('pose la bannière dans le coin désigné', async () => {
      await show({ banner: { corner: 'bottomRight', screen: null } })

      fireEvent.click(cornerNamed(words.banner.corners.topRight))

      expect(bridge.setBannerCorner).toHaveBeenCalledWith('topRight')
    })
  })

  describe('le choix de l’écran', () => {
    it('ne demande rien tant qu’il n’y a qu’un écran', async () => {
      await show({ screens: [LAPTOP] })

      expect(screen.queryByText(words.banner.screenLegend)).toBeNull()
    })

    it('ne demande rien tant que le système n’a pas répondu', () => {
      bridge.bannerScreens.mockImplementation(pending)

      render(
        <WalkScreen
          walk={{ enabled: false, banner: { corner: 'topLeft', screen: null } }}
          shortcuts={[]}
          run={() => {}}
        />
      )

      expect(screen.queryByText(words.banner.screenLegend)).toBeNull()
      expect(cornerNamed(words.banner.corners.topLeft)).not.toBeNull()
    })

    it('ne demande rien quand le système ne rend aucun écran', async () => {
      await show({ screens: [] })

      expect(screen.queryByText(words.banner.screenLegend)).toBeNull()
    })

    it('offre une pastille par écran dès qu’il y en a deux', async () => {
      await show({ screens: [LAPTOP, TELEVISION] })

      expect(screen.getByText(words.banner.screenLegend)).not.toBeNull()
      expect(chipNamed(1)).not.toBeNull()
      expect(chipNamed(2)).not.toBeNull()
    })

    it('dit la taille de chaque écran, et lequel est le principal', async () => {
      await show({ screens: [LAPTOP, TELEVISION] })

      expect(
        screen.getByText(words.banner.screenSize(3840, 2160))
      ).not.toBeNull()
      expect(screen.getAllByText(words.banner.screenPrimary)).toHaveLength(1)
    })

    it('pose la bannière sur l’écran désigné', async () => {
      await show({ screens: [LAPTOP, TELEVISION] })

      fireEvent.click(chipNamed(2))

      expect(bridge.setBannerScreen).toHaveBeenCalledWith(TELEVISION.name)
    })

    it('montre l’écran choisi comme choisi', async () => {
      await show({
        screens: [LAPTOP, TELEVISION],
        banner: { corner: 'bottomRight', screen: TELEVISION.name }
      })

      expect(chipNamed(1).getAttribute('aria-pressed')).toBe('false')
      expect(chipNamed(2).getAttribute('aria-pressed')).toBe('true')
    })

    it('retombe sur l’écran principal quand celui d’avant a été débranché', async () => {
      await show({
        screens: [LAPTOP, TELEVISION],
        banner: { corner: 'bottomRight', screen: 'un écran parti' }
      })

      expect(chipNamed(1).getAttribute('aria-pressed')).toBe('true')
      expect(chipNamed(2).getAttribute('aria-pressed')).toBe('false')
    })
  })
})
