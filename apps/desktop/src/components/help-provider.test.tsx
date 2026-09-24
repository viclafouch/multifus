import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Check } from '@/@types/onboarding'
import { READING_FLOOR_MS } from '@/constants/health'
import {
  WINDOWS_AGENT,
  onboardingOf,
  pending,
  snapshotOf,
  speakFrench
} from '@/test-doubles'

const VERDICT_WAIT_MS = READING_FLOOR_MS + 900

const ALL_READY: readonly Check[] = [
  'ready',
  'ready',
  'ready',
  'ready',
  'ready'
]

const bridge = {
  restartOnboarding: vi.fn(pending),
  openSystemPage: vi.fn(),
  checkHealth: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const ASKED = [
  'Une bannière me cache le jeu à chaque message',
  'On m’écrit et ma fenêtre ne passe pas devant',
  'Mes fenêtres ne s’agrandissent pas quand j’ouvre un client',
  'Mes raccourcis ne font rien',
  'Multifus a disparu de l’écran'
] as const

type ShowParams = {
  readonly checks?: readonly Check[]
  readonly isAutoFocusEnabled?: boolean
  readonly refuses?: boolean
}

const show = async ({
  checks = [],
  isAutoFocusEnabled = true,
  refuses = false
}: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: WINDOWS_AGENT })

  bridge.openSystemPage.mockResolvedValue(null)

  if (refuses) {
    bridge.checkHealth.mockRejectedValue(new Error('the bridge did not answer'))
  } else {
    bridge.checkHealth.mockResolvedValue(snapshotOf())
  }

  await speakFrench()

  const { HelpProvider } = await import('@/components/help-provider')
  const { MapNavigationProvider } =
    await import('@/components/map-navigation-provider')
  const { HelpSection } = await import('@/screens/settings/help-section')

  const blank = onboardingOf()
  const run = vi.fn()
  const goToMap = vi.fn()

  render(
    <MapNavigationProvider onGo={goToMap}>
      <HelpProvider
        onboarding={onboardingOf({
          steps: blank.steps.map((status, rank) => {
            return { ...status, check: checks[rank] ?? status.check }
          })
        })}
        isAutoFocusEnabled={isAutoFocusEnabled}
        run={run}
      >
        <HelpSection run={run} />
      </HelpProvider>
    </MapNavigationProvider>
  )

  return { run, goToMap }
}

const check = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }))
}

const verdictOf = async (line: string | RegExp) => {
  return screen.findByText(line, {}, { timeout: VERDICT_WAIT_MS })
}

describe('the check', () => {
  it('asks the system nothing until it is clicked', async () => {
    await show({ checks: ALL_READY })

    expect(bridge.checkHealth).not.toHaveBeenCalled()

    check()

    expect(bridge.checkHealth).toHaveBeenCalledWith()
  })

  it('says it is reading, and gives its verdict only once the answer is there', async () => {
    await show({ checks: ALL_READY })

    check()

    expect(screen.getByText('Multifus relit les réglages')).not.toBeNull()
    expect(screen.queryByText('Tout est en place')).toBeNull()

    expect(await verdictOf('Tout est en place')).not.toBeNull()
    expect(screen.queryByText('Multifus relit les réglages')).toBeNull()
  })

  it('reads again on every opening, and never in the background', async () => {
    await show({ checks: ALL_READY })

    check()
    await verdictOf('Tout est en place')

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    check()
    await verdictOf('Tout est en place')

    expect(bridge.checkHealth).toHaveBeenCalledTimes(2)
  })

  it('admits the failed read, and does it again when asked again', async () => {
    await show({ refuses: true })

    check()

    expect(
      await verdictOf('Multifus n’a pas pu relire les réglages')
    ).not.toBeNull()
    expect(screen.getByText('the bridge did not answer')).not.toBeNull()

    bridge.checkHealth.mockResolvedValue(snapshotOf())

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))

    expect(await verdictOf('Multifus ne peut pas tout lire ici')).not.toBeNull()
  })

  it('reassures when everything is open', async () => {
    await show({ checks: ALL_READY })

    check()

    expect(await verdictOf('Tout est en place')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Revoir la mise en route' })
    ).toBeNull()
  })

  it('leads to the setup when a setting is closed', async () => {
    const { run } = await show({ checks: ['blocked'] })

    check()

    expect(await verdictOf('1 réglage n’est pas en place')).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Revoir la mise en route' })
    )

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('does not count the test among the closed settings', async () => {
    await show({ checks: ['blocked', 'ready', 'ready', 'ready', 'blocked'] })

    check()

    expect(await verdictOf('1 réglage n’est pas en place')).not.toBeNull()
  })

  it('leads to the AutoFocus map when it is off', async () => {
    const { goToMap } = await show({ isAutoFocusEnabled: false })

    check()
    await verdictOf('L’AutoFocus est éteint')

    fireEvent.click(screen.getByRole('button', { name: 'Aller à l’AutoFocus' }))

    expect(goToMap).toHaveBeenCalledWith('autoFocus')
    expect(screen.queryByText('L’AutoFocus est éteint')).toBeNull()
  })

  it('hands over the frequent questions when it does not decide', async () => {
    await show()

    check()

    expect(await verdictOf('Multifus ne peut pas tout lire ici')).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Voir les questions fréquentes' })
    )

    expect(screen.queryByText('Multifus ne peut pas tout lire ici')).toBeNull()
    expect(screen.getByText(ASKED[3])).not.toBeNull()
  })
})
