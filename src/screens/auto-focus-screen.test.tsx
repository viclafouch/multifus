import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AutoFocusSwitch, NotificationKind } from '@/@types/notification'
import { APPLE_AGENT, WINDOWS_AGENT } from '@/test-doubles'

const bridge = {
  setAutoFocus: vi.fn(),
  setAutoFocusEnabled: vi.fn(),
  setWakesMinimized: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const ALL_KINDS = [
  'combat',
  'trade',
  'group',
  'private_message',
  'challenge',
  'craft',
  'perceptor'
] as const satisfies readonly NotificationKind[]

const ALL_ON = ALL_KINDS.map((kind): AutoFocusSwitch => {
  return { kind, enabled: true }
})

type ShowParams = {
  readonly switches?: readonly AutoFocusSwitch[]
  readonly isEnabled?: boolean
  readonly wakesMinimized?: boolean
  readonly agent?: string
}

const show = async ({
  switches = ALL_ON,
  isEnabled = true,
  wakesMinimized = false,
  agent = WINDOWS_AGENT
}: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { AutoFocusScreen } = await import('@/screens/auto-focus-screen')
  const { strings } = await import('@/constants/strings')

  render(
    <AutoFocusScreen
      switches={switches}
      isEnabled={isEnabled}
      wakesMinimized={wakesMinimized}
      run={() => {}}
    />
  )

  return strings.autoFocus
}

const switchNamed = (label: string) => {
  return screen.getByRole('switch', { name: label })
}

describe('l’écran de l’AutoFocus', () => {
  it('porte une ligne par événement que le jeu sait annoncer', async () => {
    const words = await show()

    for (const kind of ALL_KINDS) {
      const { label, description } = words.kinds[kind]

      expect(switchNamed(label)).not.toBeNull()
      expect(screen.getByText(description)).not.toBeNull()
    }
  })

  it('ne montre que les événements que Rust lui donne', async () => {
    const words = await show({ switches: [{ kind: 'combat', enabled: true }] })

    expect(switchNamed(words.kinds.combat.label)).not.toBeNull()
    expect(
      screen.queryByRole('switch', { name: words.kinds.craft.label })
    ).toBeNull()
  })

  it('allume l’AutoFocus quand on bouge l’interrupteur maître', async () => {
    const words = await show({ isEnabled: false })

    fireEvent.click(switchNamed(words.masterLabel))

    expect(bridge.setAutoFocusEnabled).toHaveBeenCalledWith(true)
  })

  it('éteint l’AutoFocus quand on rebouge l’interrupteur maître', async () => {
    const words = await show({ isEnabled: true })

    fireEvent.click(switchNamed(words.masterLabel))

    expect(bridge.setAutoFocusEnabled).toHaveBeenCalledWith(false)
  })

  it('coupe un événement quand on décoche sa ligne', async () => {
    const words = await show()

    fireEvent.click(switchNamed(words.kinds.combat.label))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('combat', false)
  })

  it('rallume un événement quand on recoche sa ligne', async () => {
    const words = await show({
      switches: [{ kind: 'perceptor', enabled: false }]
    })

    fireEvent.click(switchNamed(words.kinds.perceptor.label))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('perceptor', true)
  })

  it('garde en mémoire les événements cochés, l’AutoFocus éteint', async () => {
    const words = await show({
      isEnabled: false,
      switches: [
        { kind: 'combat', enabled: true },
        { kind: 'craft', enabled: false }
      ]
    })

    expect(
      switchNamed(words.kinds.combat.label).getAttribute('aria-checked')
    ).toBe('true')
    expect(
      switchNamed(words.kinds.craft.label).getAttribute('aria-checked')
    ).toBe('false')
  })

  it('laisse régler les événements même l’AutoFocus éteint', async () => {
    const words = await show({ isEnabled: false })

    fireEvent.click(switchNamed(words.kinds.trade.label))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('trade', false)
  })

  it('va chercher les fenêtres réduites quand on le lui demande', async () => {
    const words = await show({ wakesMinimized: false })

    fireEvent.click(switchNamed(words.minimizedLabel))

    expect(bridge.setWakesMinimized).toHaveBeenCalledWith(true)
  })

  it('parle de la barre des tâches sur Windows', async () => {
    const words = await show({ agent: WINDOWS_AGENT })

    expect(words.minimizedDescription).toContain('barre des tâches')
    expect(screen.getByText(words.minimizedDescription)).not.toBeNull()
  })

  it('parle du Dock sur un Mac', async () => {
    const words = await show({ agent: APPLE_AGENT })

    expect(words.minimizedDescription).toContain('Dock')
    expect(screen.getByText(words.minimizedDescription)).not.toBeNull()
  })
})
