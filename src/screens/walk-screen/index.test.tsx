import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Display } from '@/@types/display'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { BannerPlace } from '@/@types/walk'
import { strings } from '@/constants/strings'
import {
  APPLE_AGENT,
  displayOf,
  pending,
  WINDOWS_AGENT
} from '@/test-doubles'

const bridge = {
  setWalkEnabled: vi.fn(pending),
  setBannerCorner: vi.fn(pending),
  setBannerScreen: vi.fn(pending),
  bannerScreens: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const LAPTOP = displayOf()

const TELEVISION = displayOf({
  name: 'DELL U2720Q',
  width: 3840,
  height: 2160,
  primary: false
})

const ULTRAWIDE = displayOf({
  name: 'LG 34WN750',
  width: 3440,
  height: 1440,
  primary: false
})

const walkShortcut = (accelerator: string | null): ShortcutBinding => {
  return {
    action: 'walk',
    accelerator,
    status: accelerator === null ? { kind: 'unbound' } : { kind: 'registered' },
    isDefault: true
  }
}

type RenderParams = {
  readonly enabled?: boolean
  readonly banner?: BannerPlace
  readonly shortcuts?: readonly ShortcutBinding[]
  readonly agent?: string
}

const renderScreen = async ({
  enabled = false,
  banner = { corner: 'bottomRight', screen: null },
  shortcuts = [],
  agent = WINDOWS_AGENT
}: RenderParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { WalkScreen } = await import('@/screens/walk-screen')

  render(
    <WalkScreen
      walk={{ enabled, banner }}
      shortcuts={shortcuts}
      run={() => {}}
    />
  )
}

type ShowParams = RenderParams & {
  readonly screens?: readonly Display[]
}

const show = async ({ screens = [LAPTOP], ...params }: ShowParams = {}) => {
  bridge.bannerScreens.mockResolvedValue([...screens])

  await renderScreen(params)

  await screen.findByText(strings.walk.banner.description)
}

const keyCaps = () => {
  return [...document.querySelectorAll('kbd')].map((keyCap) => {
    return keyCap.textContent
  })
}

const cornerNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const chipNamed = (rank: number) => {
  return screen.getByRole('button', {
    name: new RegExp(`^${strings.walk.banner.screenName(rank)}`, 'u')
  })
}

describe('l’écran du Déplacement rapide', () => {
  it('l’allume quand on bouge l’interrupteur', async () => {
    await show({ enabled: false })

    fireEvent.click(
      screen.getByRole('switch', { name: strings.walk.switchLabel })
    )

    expect(bridge.setWalkEnabled).toHaveBeenCalledWith(true)
  })

  it('l’éteint quand on rebouge l’interrupteur', async () => {
    await show({ enabled: true })

    fireEvent.click(
      screen.getByRole('switch', { name: strings.walk.switchLabel })
    )

    expect(bridge.setWalkEnabled).toHaveBeenCalledWith(false)
  })

  it('dit qu’il est allumé, et ce que valent les clics', async () => {
    await show({ enabled: true })

    expect(screen.getByText(strings.walk.state.on.badge)).not.toBeNull()
    expect(screen.getByText(strings.walk.state.on.body)).not.toBeNull()
    expect(screen.queryByText(strings.walk.state.off.badge)).toBeNull()
  })

  it('dit qu’il est éteint, et ce que valent les clics', async () => {
    await show({ enabled: false })

    expect(screen.getByText(strings.walk.state.off.badge)).not.toBeNull()
    expect(screen.getByText(strings.walk.state.off.body)).not.toBeNull()
    expect(screen.queryByText(strings.walk.state.on.badge)).toBeNull()
  })

  describe('le rappel du raccourci', () => {
    it('dessine les touches du raccourci', async () => {
      await show({ shortcuts: [walkShortcut('Control+Shift+KeyW')] })

      expect(keyCaps()).toStrictEqual(['Ctrl', 'Maj', 'W'])
    })

    it('dit qu’il n’y en a aucune tant que rien n’est posé', async () => {
      await show({ shortcuts: [walkShortcut(null)] })

      expect(screen.getByText(strings.shortcuts.empty)).not.toBeNull()
      expect(keyCaps()).toStrictEqual([])
    })

    it('dit qu’il n’y en a aucune quand il n’est pas dans la liste', async () => {
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

      expect(screen.getByText(strings.shortcuts.empty)).not.toBeNull()
    })
  })

  describe('le conseil sur le plein écran', () => {
    it('dit de garder les clients en fenêtre agrandie, sur un Mac', async () => {
      await show({ agent: APPLE_AGENT })

      expect(screen.getByText(strings.maximize.note)).not.toBeNull()
    })

    it('ne dit rien sur Windows', async () => {
      await show({ agent: WINDOWS_AGENT })

      expect(screen.queryByText(strings.maximize.note)).toBeNull()
    })
  })

  describe('le coin de la bannière', () => {
    it('dessine l’écran au format de celui qui porte la bannière', async () => {
      await show({
        screens: [ULTRAWIDE],
        banner: { corner: 'topLeft', screen: ULTRAWIDE.name }
      })

      const monitor = screen.getByRole('group', {
        name: strings.walk.banner.cornerLegend
      })

      expect(monitor.style.aspectRatio).toBe(`${3440 / 1440} / 1`)
    })

    it('offre les quatre coins', async () => {
      await show()

      for (const label of Object.values(strings.walk.banner.corners)) {
        expect(cornerNamed(label)).not.toBeNull()
      }
    })

    it('montre le coin en cours comme choisi, et lui seul', async () => {
      await show({ banner: { corner: 'topLeft', screen: null } })

      expect(
        cornerNamed(strings.walk.banner.corners.topLeft).getAttribute(
          'aria-pressed'
        )
      ).toBe('true')
      expect(
        cornerNamed(strings.walk.banner.corners.bottomRight).getAttribute(
          'aria-pressed'
        )
      ).toBe('false')
    })

    it('pose la bannière dans le coin désigné', async () => {
      await show({ banner: { corner: 'bottomRight', screen: null } })

      fireEvent.click(cornerNamed(strings.walk.banner.corners.topRight))

      expect(bridge.setBannerCorner).toHaveBeenCalledWith('topRight')
    })
  })

  describe('le choix de l’écran', () => {
    it('ne demande rien tant qu’il n’y a qu’un écran', async () => {
      await show({ screens: [LAPTOP] })

      expect(screen.queryByText(strings.walk.banner.screenLegend)).toBeNull()
    })

    it('ne demande rien tant que le système n’a pas répondu', async () => {
      bridge.bannerScreens.mockImplementation(pending)

      await renderScreen({ banner: { corner: 'topLeft', screen: null } })

      expect(screen.queryByText(strings.walk.banner.screenLegend)).toBeNull()
      expect(cornerNamed(strings.walk.banner.corners.topLeft)).not.toBeNull()
    })

    it('ne demande rien quand le système ne rend aucun écran', async () => {
      await show({ screens: [] })

      expect(screen.queryByText(strings.walk.banner.screenLegend)).toBeNull()
    })

    it('offre une pastille par écran dès qu’il y en a deux', async () => {
      await show({ screens: [LAPTOP, TELEVISION] })

      expect(screen.getByText(strings.walk.banner.screenLegend)).not.toBeNull()
      expect(chipNamed(1)).not.toBeNull()
      expect(chipNamed(2)).not.toBeNull()
    })

    it('dit la taille de chaque écran, et lequel est le principal', async () => {
      await show({ screens: [LAPTOP, TELEVISION] })

      expect(
        screen.getByText(strings.walk.banner.screenSize(3840, 2160))
      ).not.toBeNull()
      expect(
        screen.getAllByText(strings.walk.banner.screenPrimary)
      ).toHaveLength(1)
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
