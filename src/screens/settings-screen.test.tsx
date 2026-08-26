import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'

function pending(): Promise<never> {
  return new Promise(() => {})
}

const bridge = vi.hoisted(() => {
  return {
    setStartAtLogin: vi.fn(pending),
    setMaximizeOnLaunch: vi.fn(pending),
    setShortTitles: vi.fn(pending),
    setPaintPortraits: vi.fn(pending),
    setUngroupTaskbar: vi.fn(pending)
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const APPLE_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
const WINDOWS_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

type ShowParams = {
  readonly agent: string
  readonly taskbarCombines?: boolean
}

const show = async ({ agent, taskbarCombines = true }: ShowParams) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { SettingsScreen } = await import('@/screens/settings-screen')

  render(
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

describe('l’écran des paramètres', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('porte les six lignes, sur les deux systèmes', async () => {
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

  it('lance Multifus au démarrage quand on bouge l’interrupteur', async () => {
    await show({ agent: WINDOWS_AGENT })

    fireEvent.click(switchNamed(strings.settings.startupLabel))

    expect(bridge.setStartAtLogin).toHaveBeenCalledWith(true)
  })

  it('ouvre les clients en plein écran quand on bouge l’interrupteur', async () => {
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

  it('garde le démarrage et le plein écran sur un Mac', async () => {
    await show({ agent: APPLE_AGENT })

    expect(querySwitch(strings.settings.startupLabel)).not.toBeNull()
    expect(querySwitch(strings.settings.maximizeLabel)).not.toBeNull()
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
