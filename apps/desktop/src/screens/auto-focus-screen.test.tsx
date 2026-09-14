import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AutoFocusSwitch, NotificationKind } from '@/@types/notification'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  pending,
  speakFrench
} from '@/test-doubles'

const bridge = {
  setAutoFocus: vi.fn(),
  setAutoFocusEnabled: vi.fn(),
  setWakesMinimized: vi.fn(),
  setLoopSeen: vi.fn(pending)
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

  await speakFrench()

  const { AutoFocusScreen } = await import('@/screens/auto-focus-screen')
  const { NOTIFICATION_LABELS } = await import('@/constants/notification')

  render(
    <AutoFocusScreen
      switches={switches}
      isEnabled={isEnabled}
      wakesMinimized={wakesMinimized}
      run={() => {}}
    />
  )

  return NOTIFICATION_LABELS
}

const switchNamed = (label: string) => {
  return screen.getByRole('switch', { name: label })
}

describe('the AutoFocus screen', () => {
  it('carries one row per event the game can announce', async () => {
    const kinds = await show()

    for (const kind of ALL_KINDS) {
      const { label, description } = kinds[kind]

      expect(switchNamed(i18n._(label))).not.toBeNull()
      expect(screen.getByText(i18n._(description))).not.toBeNull()
    }
  })

  it('shows only the events Rust gives it', async () => {
    const kinds = await show({ switches: [{ kind: 'combat', enabled: true }] })

    expect(switchNamed(i18n._(kinds.combat.label))).not.toBeNull()
    expect(
      screen.queryByRole('switch', { name: i18n._(kinds.craft.label) })
    ).toBeNull()
  })

  it('turns AutoFocus on when the master switch is moved', async () => {
    await show({ isEnabled: false })

    fireEvent.click(switchNamed('Activer l’AutoFocus'))

    expect(bridge.setAutoFocusEnabled).toHaveBeenCalledWith(true)
  })

  it('turns AutoFocus off when the master switch is moved again', async () => {
    await show({ isEnabled: true })

    fireEvent.click(switchNamed('Activer l’AutoFocus'))

    expect(bridge.setAutoFocusEnabled).toHaveBeenCalledWith(false)
  })

  it('cuts an event when its row is unchecked', async () => {
    const kinds = await show()

    fireEvent.click(switchNamed(i18n._(kinds.combat.label)))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('combat', false)
  })

  it('turns an event back on when its row is checked again', async () => {
    const kinds = await show({
      switches: [{ kind: 'perceptor', enabled: false }]
    })

    fireEvent.click(switchNamed(i18n._(kinds.perceptor.label)))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('perceptor', true)
  })

  it('keeps the checked events in memory, with AutoFocus off', async () => {
    const kinds = await show({
      isEnabled: false,
      switches: [
        { kind: 'combat', enabled: true },
        { kind: 'craft', enabled: false }
      ]
    })

    expect(
      switchNamed(i18n._(kinds.combat.label)).getAttribute('aria-checked')
    ).toBe('true')
    expect(
      switchNamed(i18n._(kinds.craft.label)).getAttribute('aria-checked')
    ).toBe('false')
  })

  it('lets the events be set even with AutoFocus off', async () => {
    const kinds = await show({ isEnabled: false })

    fireEvent.click(switchNamed(i18n._(kinds.trade.label)))

    expect(bridge.setAutoFocus).toHaveBeenCalledWith('trade', false)
  })

  it('goes and gets the minimized windows when it is asked to', async () => {
    await show({ wakesMinimized: false })

    fireEvent.click(switchNamed('Aller chercher les fenêtres réduites'))

    expect(bridge.setWakesMinimized).toHaveBeenCalledWith(true)
  })

  it('speaks of the taskbar on Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    expect(
      screen.getByText(
        'Même un personnage rangé dans la barre des tâches revient devant vous.'
      )
    ).not.toBeNull()
  })

  it('speaks of the Dock on a Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(
      screen.getByText(
        'Même un personnage rangé dans le Dock revient devant vous.'
      )
    ).not.toBeNull()
  })
})
