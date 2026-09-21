import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Clients } from '@/@types/snapshot'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ignore } from '@/lib/utils'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  snapshotOf,
  speakFrench
} from '@/test-doubles'

const bridge = {
  setStartAtLogin: vi.fn(),
  setMaximizeOnLaunch: vi.fn(),
  maximizeAllClients: vi.fn(),
  clients: vi.fn(),
  watchClients: vi.fn(),
  onClients: vi.fn(),
  setShortTitles: vi.fn(),
  setPaintPortraits: vi.fn(),
  setUngroupTaskbar: vi.fn(),
  setShareStats: vi.fn()
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

  await speakFrench()

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
        shareStats
        run={() => {}}
      />
    </TooltipProvider>
  )

  await screen.findByRole('button', { name: 'Agrandir les fenêtres' })

  return shown
}

const switchNamed = (label: string) => {
  return screen.getByRole('switch', { name: label })
}

const querySwitch = (label: string) => {
  return screen.queryByRole('switch', { name: label })
}

const WINDOWS_ONLY_LABELS = [
  'Seulement le pseudo dans la barre des tâches',
  'La tête de classe dans la barre des tâches',
  'Un bouton par personnage dans la barre des tâches'
]

const maximizeButton = () => {
  return screen.getByRole('button', { name: 'Agrandir les fenêtres' })
}

describe('the settings screen', () => {
  beforeEach(() => {
    counter.told = null
  })

  it('carries the setup under the settings, on one row', async () => {
    await show({ agent: APPLE_AGENT })

    expect(screen.getByText('Revoir la mise en route')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Revoir' })).not.toBeNull()
  })

  it('carries the six setting rows, on both systems', async () => {
    await show({ agent: WINDOWS_AGENT })

    for (const label of [
      'Lancer Multifus au démarrage de l’ordinateur',
      'Agrandir les clients à leur ouverture',
      'Garder Multifus en arrière-plan',
      ...WINDOWS_ONLY_LABELS
    ]) {
      expect(screen.getByText(label)).not.toBeNull()
    }
  })

  it('counts the clients left small, and offers to enlarge them', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 2, readable: true }
    })

    expect(screen.getByText('2 clients en petit')).not.toBeNull()
    expect(
      screen.getByText(
        'Un client ouvert avant Multifus garde sa petite taille.'
      )
    ).not.toBeNull()
  })

  it('says everything is already enlarged when nothing is small any more', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 0, readable: true }
    })

    expect(screen.getByText('Tout est agrandi')).not.toBeNull()
    expect(
      screen.getByText('Vos clients Dofus Retro couvrent déjà tout leur écran.')
    ).not.toBeNull()
  })

  it('says no client is open, and keeps the button', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: true }
    })

    expect(screen.getByText('Aucun client ouvert')).not.toBeNull()
    expect(maximizeButton()).not.toBeNull()
  })

  it('says it cannot read the windows, rather than that it sees none', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: false }
    })

    expect(screen.getByText('Fenêtres illisibles')).not.toBeNull()
    expect(screen.queryByText('Aucun client ouvert')).toBeNull()
  })

  it('enlarges the clients in one click', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(maximizeButton())

    expect(bridge.maximizeAllClients).toHaveBeenCalledWith()
  })

  it('follows the size of the windows without the screen being left', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 2, readable: true }
    })

    expect(bridge.watchClients).toHaveBeenCalledWith(true)

    act(() => {
      counter.told?.({ open: 3, small: 0, readable: true })
    })

    expect(screen.getByText('Tout est agrandi')).not.toBeNull()

    act(() => {
      counter.told?.({ open: 3, small: 1, readable: true })
    })

    expect(screen.getByText('1 client en petit')).not.toBeNull()
  })

  it('stops following as soon as the screen is left', async () => {
    const { unmount } = await show({ agent: WINDOWS_AGENT })

    unmount()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(false)
    })
  })

  it('keeps the enlarge button on a Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(maximizeButton()).not.toBeNull()
  })

  it('starts Multifus at boot when the switch is moved', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed('Lancer Multifus au démarrage de l’ordinateur'))

    expect(bridge.setStartAtLogin).toHaveBeenCalledWith(true)
  })

  it('enlarges the clients when they open when the switch is moved', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed('Agrandir les clients à leur ouverture'))

    expect(bridge.setMaximizeOnLaunch).toHaveBeenCalledWith(true)
  })

  it('sells the measuring rather than listing it, and marks it anonymous', async () => {
    await show({ agent: APPLE_AGENT })

    expect(screen.getByText('Partager des statistiques d’usage')).not.toBeNull()
    expect(
      screen.getByText(
        'C’est comme ça que Multifus sait quoi améliorer. Ce que vous écrivez ne part jamais.'
      )
    ).not.toBeNull()

    const anonymous = screen.getByText('Anonyme')

    expect(anonymous.className).toContain('plaque-leaf')
  })

  it('stops the measuring when the switch is moved', async () => {
    await show({ agent: APPLE_AGENT })

    fireEvent.click(switchNamed('Partager des statistiques d’usage'))

    expect(bridge.setShareStats).toHaveBeenCalledWith(false)
  })

  it('cuts the class head when the switch is moved, on Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed('La tête de classe dans la barre des tâches'))

    expect(bridge.setPaintPortraits).toHaveBeenCalledWith(false)
  })

  it('offers the three Windows rows on Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).not.toBeNull()
    }

    expect(screen.queryByText('Uniquement sur Windows')).toBeNull()
  })

  it('says the three Windows rows do not exist on a Mac', async () => {
    await show({ agent: APPLE_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).toBeNull()
    }

    expect(screen.getAllByText('Uniquement sur Windows')).toHaveLength(
      WINDOWS_ONLY_LABELS.length
    )
  })

  it('keeps the boot and the enlargement on a Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(
      querySwitch('Lancer Multifus au démarrage de l’ordinateur')
    ).not.toBeNull()
    expect(querySwitch('Agrandir les clients à leur ouverture')).not.toBeNull()
  })

  it('advises the enlarged window rather than full screen, on a Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(
      screen.getByText(
        'Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.'
      )
    ).not.toBeNull()
  })

  it('says nothing about full screen on Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    expect(
      screen.queryByText(
        'Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.'
      )
    ).toBeNull()
  })

  it('never offers to leave the background', async () => {
    await show({ agent: WINDOWS_AGENT })

    const background = switchNamed('Garder Multifus en arrière-plan')

    expect(background.getAttribute('aria-disabled')).toBe('true')
    expect(background.getAttribute('aria-checked')).toBe('true')
  })

  it('says the taskbar already sticks nothing together, when it is the case', async () => {
    await show({ agent: WINDOWS_AGENT, taskbarCombines: false })

    expect(
      screen.getByText(
        'Déjà fait : votre Windows ne colle jamais les fenêtres ensemble.'
      )
    ).not.toBeNull()
    expect(
      screen.queryByText(
        'Chaque client garde son bouton au lieu d’être empilé avec les autres.'
      )
    ).toBeNull()
  })

  it('explains the grouping when the taskbar sticks the windows together', async () => {
    await show({ agent: WINDOWS_AGENT, taskbarCombines: true })

    expect(
      screen.getByText(
        'Chaque client garde son bouton au lieu d’être empilé avec les autres.'
      )
    ).not.toBeNull()
    expect(
      screen.queryByText(
        'Déjà fait : votre Windows ne colle jamais les fenêtres ensemble.'
      )
    ).toBeNull()
  })
})
