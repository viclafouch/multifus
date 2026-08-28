import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Clients } from '@/@types/snapshot'
import { TooltipProvider } from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'
import { ignore } from '@/lib/utils'
import { APPLE_AGENT, snapshotOf, WINDOWS_AGENT } from '@/test-doubles'

const bridge = {
  setStartAtLogin: vi.fn(),
  setMaximizeOnLaunch: vi.fn(),
  maximizeAllClients: vi.fn(),
  clients: vi.fn(),
  watchClients: vi.fn(),
  onClients: vi.fn(),
  setShortTitles: vi.fn(),
  setPaintPortraits: vi.fn(),
  setUngroupTaskbar: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const counter = { told: null as ((counted: Clients) => void) | null }

type ShowParams = {
  readonly agent: string
  readonly taskbarCombines?: boolean
  readonly clients?: Clients
}

const show = async ({
  agent,
  taskbarCombines = true,
  clients = { open: 3, small: 1, readable: true }
}: ShowParams) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })
  bridge.clients.mockResolvedValue(clients)
  bridge.watchClients.mockResolvedValue(null)
  bridge.maximizeAllClients.mockResolvedValue(snapshotOf())
  bridge.onClients.mockImplementation(async (handle: (of: Clients) => void) => {
    counter.told = handle

    return ignore
  })

  const { SettingsScreen } = await import('@/screens/settings')

  const shown = render(
    <TooltipProvider>
      <SettingsScreen
        startAtLogin={false}
        maximizeOnLaunch={false}
        shortTitles={false}
        paintPortraits
        ungroupTaskbar={false}
        taskbarCombines={taskbarCombines}
        run={() => {}}
      />
    </TooltipProvider>
  )

  await screen.findByRole('button', { name: strings.settings.clients.action })

  return shown
}

const switchNamed = (label: string) => {
  return screen.getByRole('switch', { name: label })
}

const querySwitch = (label: string) => {
  return screen.queryByRole('switch', { name: label })
}

const WINDOWS_ONLY_LABELS = [
  strings.settings.shortTitlesLabel,
  strings.settings.portraitLabel,
  strings.settings.ungroupLabel
]

const maximizeButton = () => {
  return screen.getByRole('button', { name: strings.settings.clients.action })
}

describe('l’écran des paramètres', () => {
  beforeEach(() => {
    counter.told = null
  })

  it('porte les six lignes de réglages, sur les deux systèmes', async () => {
    await show({ agent: WINDOWS_AGENT })

    for (const label of [
      strings.settings.startupLabel,
      strings.settings.maximizeLabel,
      strings.settings.backgroundLabel,
      ...WINDOWS_ONLY_LABELS
    ]) {
      expect(screen.getByText(label)).not.toBeNull()
    }
  })

  it('compte les clients restés en petit, et propose de les agrandir', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 2, readable: true }
    })

    expect(
      screen.getByText(strings.settings.clients.badge.small(2))
    ).not.toBeNull()
    expect(screen.getByText(strings.settings.clients.body.small)).not.toBeNull()
  })

  it('dit que tout est déjà agrandi quand plus rien n’est en petit', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 0, readable: true }
    })

    expect(
      screen.getByText(strings.settings.clients.badge.maximized)
    ).not.toBeNull()
    expect(
      screen.getByText(strings.settings.clients.body.maximized)
    ).not.toBeNull()
  })

  it('dit qu’aucun client n’est ouvert, et garde le bouton', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: true }
    })

    expect(screen.getByText(strings.settings.clients.badge.none)).not.toBeNull()
    expect(maximizeButton()).not.toBeNull()
  })

  it('dit qu’il ne peut pas lire les fenêtres, plutôt qu’il n’en voit aucune', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: false }
    })

    expect(
      screen.getByText(strings.settings.clients.badge.unreadable)
    ).not.toBeNull()
    expect(screen.queryByText(strings.settings.clients.badge.none)).toBeNull()
  })

  it('agrandit les clients d’un clic', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(maximizeButton())

    expect(bridge.maximizeAllClients).toHaveBeenCalledWith()
  })

  it('suit la taille des fenêtres sans qu’on quitte l’écran', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 2, readable: true }
    })

    expect(bridge.watchClients).toHaveBeenCalledWith(true)

    act(() => {
      counter.told?.({ open: 3, small: 0, readable: true })
    })

    expect(
      screen.getByText(strings.settings.clients.badge.maximized)
    ).not.toBeNull()

    act(() => {
      counter.told?.({ open: 3, small: 1, readable: true })
    })

    expect(
      screen.getByText(strings.settings.clients.badge.small(1))
    ).not.toBeNull()
  })

  it('cesse de suivre dès qu’on quitte l’écran', async () => {
    const { unmount } = await show({ agent: WINDOWS_AGENT })

    unmount()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(false)
    })
  })

  it('garde le bouton d’agrandissement sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(maximizeButton()).not.toBeNull()
  })

  it('lance Multifus au démarrage quand on bouge l’interrupteur', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed(strings.settings.startupLabel))

    expect(bridge.setStartAtLogin).toHaveBeenCalledWith(true)
  })

  it('agrandit les clients à leur ouverture quand on bouge l’interrupteur', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed(strings.settings.maximizeLabel))

    expect(bridge.setMaximizeOnLaunch).toHaveBeenCalledWith(true)
  })

  it('coupe la tête de classe quand on bouge l’interrupteur, sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed(strings.settings.portraitLabel))

    expect(bridge.setPaintPortraits).toHaveBeenCalledWith(false)
  })

  it('offre les trois lignes de Windows sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).not.toBeNull()
    }

    expect(screen.queryByText(strings.settings.windowsOnlyLabel)).toBeNull()
  })

  it('dit que les trois lignes de Windows n’existent pas sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).toBeNull()
    }

    expect(screen.getAllByText(strings.settings.windowsOnlyLabel)).toHaveLength(
      WINDOWS_ONLY_LABELS.length
    )
  })

  it('garde le démarrage et l’agrandissement sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(querySwitch(strings.settings.startupLabel)).not.toBeNull()
    expect(querySwitch(strings.settings.maximizeLabel)).not.toBeNull()
  })

  it('conseille la fenêtre agrandie plutôt que le plein écran, sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(screen.getByText(strings.maximize.note)).not.toBeNull()
  })

  it('ne dit rien du plein écran sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    expect(screen.queryByText(strings.maximize.note)).toBeNull()
  })

  it('n’offre jamais de quitter l’arrière-plan', async () => {
    await show({ agent: WINDOWS_AGENT })

    const background = switchNamed(strings.settings.backgroundLabel)

    expect(background.getAttribute('aria-disabled')).toBe('true')
    expect(background.getAttribute('aria-checked')).toBe('true')
  })

  it('dit que la barre des tâches ne colle déjà rien, quand c’est le cas', async () => {
    await show({ agent: WINDOWS_AGENT, taskbarCombines: false })

    expect(screen.getByText(strings.settings.ungroupAlready)).not.toBeNull()
    expect(screen.queryByText(strings.settings.ungroupDescription)).toBeNull()
  })

  it('explique le regroupement quand la barre des tâches colle les fenêtres', async () => {
    await show({ agent: WINDOWS_AGENT, taskbarCombines: true })

    expect(screen.getByText(strings.settings.ungroupDescription)).not.toBeNull()
    expect(screen.queryByText(strings.settings.ungroupAlready)).toBeNull()
  })
})
