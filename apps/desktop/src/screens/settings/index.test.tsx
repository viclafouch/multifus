import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Clients } from '@/@types/snapshot'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ignore } from '@/lib/utils'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  onboardingOf,
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
        onboarding={onboardingOf()}
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

describe('l’écran des paramètres', () => {
  beforeEach(() => {
    counter.told = null
  })

  it('porte la prise en main sous les réglages', async () => {
    await show({ agent: APPLE_AGENT })

    expect(screen.getByText('Prise en main')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Revoir' })).not.toBeNull()
  })

  it('porte les six lignes de réglages, sur les deux systèmes', async () => {
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

  it('compte les clients restés en petit, et propose de les agrandir', async () => {
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

  it('dit que tout est déjà agrandi quand plus rien n’est en petit', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 3, small: 0, readable: true }
    })

    expect(screen.getByText('Tout est agrandi')).not.toBeNull()
    expect(
      screen.getByText('Vos clients Dofus Retro couvrent déjà tout leur écran.')
    ).not.toBeNull()
  })

  it('dit qu’aucun client n’est ouvert, et garde le bouton', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: true }
    })

    expect(screen.getByText('Aucun client ouvert')).not.toBeNull()
    expect(maximizeButton()).not.toBeNull()
  })

  it('dit qu’il ne peut pas lire les fenêtres, plutôt qu’il n’en voit aucune', async () => {
    await show({
      agent: WINDOWS_AGENT,
      clients: { open: 0, small: 0, readable: false }
    })

    expect(screen.getByText('Fenêtres illisibles')).not.toBeNull()
    expect(screen.queryByText('Aucun client ouvert')).toBeNull()
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

    expect(screen.getByText('Tout est agrandi')).not.toBeNull()

    act(() => {
      counter.told?.({ open: 3, small: 1, readable: true })
    })

    expect(screen.getByText('1 client en petit')).not.toBeNull()
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

    fireEvent.click(switchNamed('Lancer Multifus au démarrage de l’ordinateur'))

    expect(bridge.setStartAtLogin).toHaveBeenCalledWith(true)
  })

  it('agrandit les clients à leur ouverture quand on bouge l’interrupteur', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed('Agrandir les clients à leur ouverture'))

    expect(bridge.setMaximizeOnLaunch).toHaveBeenCalledWith(true)
  })

  it('coupe la tête de classe quand on bouge l’interrupteur, sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed('La tête de classe dans la barre des tâches'))

    expect(bridge.setPaintPortraits).toHaveBeenCalledWith(false)
  })

  it('offre les trois lignes de Windows sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).not.toBeNull()
    }

    expect(screen.queryByText('Uniquement sur Windows')).toBeNull()
  })

  it('dit que les trois lignes de Windows n’existent pas sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    for (const label of WINDOWS_ONLY_LABELS) {
      expect(querySwitch(label)).toBeNull()
    }

    expect(screen.getAllByText('Uniquement sur Windows')).toHaveLength(
      WINDOWS_ONLY_LABELS.length
    )
  })

  it('garde le démarrage et l’agrandissement sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(
      querySwitch('Lancer Multifus au démarrage de l’ordinateur')
    ).not.toBeNull()
    expect(querySwitch('Agrandir les clients à leur ouverture')).not.toBeNull()
  })

  it('conseille la fenêtre agrandie plutôt que le plein écran, sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(
      screen.getByText(
        'Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.'
      )
    ).not.toBeNull()
  })

  it('ne dit rien du plein écran sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    expect(
      screen.queryByText(
        'Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.'
      )
    ).toBeNull()
  })

  it('n’offre jamais de quitter l’arrière-plan', async () => {
    await show({ agent: WINDOWS_AGENT })

    const background = switchNamed('Garder Multifus en arrière-plan')

    expect(background.getAttribute('aria-disabled')).toBe('true')
    expect(background.getAttribute('aria-checked')).toBe('true')
  })

  it('dit que la barre des tâches ne colle déjà rien, quand c’est le cas', async () => {
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

  it('explique le regroupement quand la barre des tâches colle les fenêtres', async () => {
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
