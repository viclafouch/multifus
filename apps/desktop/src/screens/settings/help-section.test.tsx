import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Check } from '@/@types/onboarding'
import { MapNavigationProvider } from '@/components/map-navigation-provider'
import { QUESTIONS } from '@/constants/questions'
import { onboardingOf, pending, speakFrench } from '@/test-doubles'

const bridge = {
  restartOnboarding: vi.fn(pending),
  openSystemPage: vi.fn()
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
  checks?: readonly Check[]
  isAutoFocusEnabled?: boolean
}

const show = async ({
  checks = [],
  isAutoFocusEnabled = true
}: ShowParams = {}) => {
  bridge.openSystemPage.mockResolvedValue(null)

  await speakFrench()

  const { HelpSection } = await import('@/screens/settings/help-section')
  const blank = onboardingOf()
  const run = vi.fn()
  const goToMap = vi.fn()

  render(
    <MapNavigationProvider onGo={goToMap}>
      <HelpSection
        onboarding={onboardingOf({
          steps: blank.steps.map((status, rank) => {
            return { ...status, check: checks[rank] ?? status.check }
          })
        })}
        isAutoFocusEnabled={isAutoFocusEnabled}
        run={run}
      />
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

describe('le panneau du doute, sous les réglages', () => {
  it('offre les trois gestes, et ne rejoue pas le tableau des étapes', async () => {
    await show()

    expect(screen.getByText('Est-ce que tout marche ?')).not.toBeNull()
    expect(screen.getByText('Questions fréquentes')).not.toBeNull()
    expect(screen.getByText('Revoir la mise en route')).not.toBeNull()
    expect(screen.queryByText('Laissez Multifus voir vos fenêtres')).toBeNull()
  })

  it('relance la mise en route, et attend l’instantané', async () => {
    const { run } = await show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }))

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })
})

describe('la vérification', () => {
  it('rassure quand tout est ouvert', async () => {
    await show({ checks: ['ready', 'ready', 'ready', 'ready', 'ready'] })

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getByText('Tout est en place')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Revoir la mise en route' })
    ).toBeNull()
  })

  it('mène à la mise en route quand un réglage est fermé', async () => {
    const { run } = await show({ checks: ['blocked'] })

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getByText('1 réglage n’est pas en place')).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Revoir la mise en route' })
    )

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('mène à la map AutoFocus quand il est éteint', async () => {
    const { goToMap } = await show({ isAutoFocusEnabled: false })

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }))

    fireEvent.click(screen.getByRole('button', { name: 'Aller à l’AutoFocus' }))

    expect(goToMap).toHaveBeenCalledWith('autoFocus')
    expect(screen.queryByText('L’AutoFocus est éteint')).toBeNull()
  })
})

describe('les questions fréquentes', () => {
  it('ne montre rien tant qu’on n’a pas ouvert', async () => {
    await show()

    expect(screen.queryByText(ASKED[3])).toBeNull()
  })

  it('pose chaque question de la table, et aucune de plus', async () => {
    await openQuestions()

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      QUESTIONS.length
    )
    expect(ASKED).toHaveLength(QUESTIONS.length)

    for (const question of ASKED) {
      expect(screen.getByText(question)).not.toBeNull()
    }
  })

  it('garde la réponse pliée tant qu’on n’a pas posé la question', async () => {
    await openQuestions()

    expect(
      screen.queryByText(/un réglage a pu changer sans le dire/u)
    ).toBeNull()

    ask(ASKED[1])

    expect(
      screen.getByText(/un réglage a pu changer sans le dire/u)
    ).not.toBeNull()
  })

  it('ne garde qu’une réponse ouverte à la fois', async () => {
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

  it('mène aux réglages du système quand la réponse y est', async () => {
    await openQuestions()

    ask(ASKED[0])

    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Notifications' })
    )

    expect(bridge.openSystemPage).toHaveBeenCalledWith('notifications')
  })

  it('emmène à la map Raccourcis et ferme derrière elle', async () => {
    const { goToMap } = await openQuestions()

    ask(ASKED[3])

    fireEvent.click(
      screen.getByRole('button', { name: 'Aller aux Raccourcis' })
    )

    expect(goToMap).toHaveBeenCalledWith('shortcuts')
    expect(screen.queryByText(ASKED[3])).toBeNull()
  })

  it('relance la mise en route depuis la réponse', async () => {
    const { run } = await openQuestions()

    ask(ASKED[1])

    fireEvent.click(
      screen.getByRole('button', { name: 'Revoir la mise en route' })
    )

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
    expect(screen.queryByText(ASKED[1])).toBeNull()
  })

  it('ferme le dialogue pour montrer le réglage qui agrandit', async () => {
    await openQuestions()

    ask(ASKED[2])

    fireEvent.click(screen.getByRole('button', { name: 'Voir le réglage' }))

    expect(screen.queryByText(ASKED[2])).toBeNull()
  })

  it('se ferme sur la croix', async () => {
    await openQuestions()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(screen.queryByText(ASKED[3])).toBeNull()
  })
})
