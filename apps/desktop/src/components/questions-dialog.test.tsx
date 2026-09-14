import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QUESTIONS } from '@/constants/questions'
import { ignore } from '@/lib/utils'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  onboardingOf,
  pending,
  snapshotOf,
  speakFrench
} from '@/test-doubles'

const bridge = {
  restartOnboarding: vi.fn(pending),
  openSystemPage: vi.fn(),
  onHealthAsked: vi.fn(),
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
  readonly agent?: string
}

const show = async ({ agent = WINDOWS_AGENT }: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  bridge.openSystemPage.mockResolvedValue(null)
  bridge.checkHealth.mockResolvedValue(snapshotOf())
  bridge.onHealthAsked.mockImplementation(async () => {
    return ignore
  })

  await speakFrench()

  const { HelpProvider } = await import('@/components/help-provider')
  const { MapNavigationProvider } =
    await import('@/components/map-navigation-provider')
  const { HelpSection } = await import('@/screens/settings/help-section')

  const run = vi.fn()
  const goToMap = vi.fn()

  render(
    <MapNavigationProvider onGo={goToMap}>
      <HelpProvider onboarding={onboardingOf()} isAutoFocusEnabled run={run}>
        <HelpSection run={run} />
      </HelpProvider>
    </MapNavigationProvider>
  )

  return { run, goToMap }
}

const openQuestions = async (params: ShowParams = {}) => {
  const shown = await show(params)

  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

  return shown
}

const ask = (asked: string) => {
  fireEvent.click(screen.getByRole('button', { name: asked }))
}

describe('the frequent questions', () => {
  it('shows nothing until it is opened', async () => {
    await show()

    expect(screen.queryByText(ASKED[3])).toBeNull()
  })

  it('asks every question of the table, and none more', async () => {
    await openQuestions()

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      QUESTIONS.length
    )
    expect(ASKED).toHaveLength(QUESTIONS.length)

    for (const question of ASKED) {
      expect(screen.getByText(question)).not.toBeNull()
    }
  })

  it('keeps the answer folded until the question is asked', async () => {
    await openQuestions()

    expect(
      screen.queryByText(/un réglage a pu changer sans le dire/u)
    ).toBeNull()

    ask(ASKED[1])

    expect(
      screen.getByText(/un réglage a pu changer sans le dire/u)
    ).not.toBeNull()
  })

  it('keeps only one answer open at a time', async () => {
    await openQuestions()

    ask(ASKED[1])
    ask(ASKED[3])

    expect(
      screen.queryByText(/un réglage a pu changer sans le dire/u)
    ).toBeNull()
    expect(
      screen.getByText(/Cliquez d’abord dans une fenêtre Dofus/u)
    ).not.toBeNull()
  })

  it('leads to the system settings when the answer is there', async () => {
    await openQuestions()

    ask(ASKED[0])

    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Notifications' })
    )

    expect(bridge.openSystemPage).toHaveBeenCalledWith('notifications')
  })

  it('hands over no panel on Mac, where the banner is to be kept', async () => {
    await openQuestions({ agent: APPLE_AGENT })

    ask(ASKED[0])

    expect(screen.getByText(/c’est elle qui prévient Multifus/u)).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Ouvrir Notifications' })
    ).toBeNull()
  })

  it('takes you to the Shortcuts map and closes behind it', async () => {
    const { goToMap } = await openQuestions()

    ask(ASKED[3])

    fireEvent.click(
      screen.getByRole('button', { name: 'Aller aux Raccourcis' })
    )

    expect(goToMap).toHaveBeenCalledWith('shortcuts')
    expect(screen.queryByText(ASKED[3])).toBeNull()
  })

  it('starts the setup again from the answer', async () => {
    const { run } = await openQuestions()

    ask(ASKED[1])

    fireEvent.click(
      screen.getByRole('button', { name: 'Revoir la mise en route' })
    )

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
    expect(screen.queryByText(ASKED[1])).toBeNull()
  })

  it('closes the dialog to show the setting that enlarges', async () => {
    await openQuestions()

    ask(ASKED[2])

    fireEvent.click(screen.getByRole('button', { name: 'Voir le réglage' }))

    expect(screen.queryByText(ASKED[2])).toBeNull()
  })

  it('closes on the cross', async () => {
    await openQuestions()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(screen.queryByText(ASKED[3])).toBeNull()
  })
})
