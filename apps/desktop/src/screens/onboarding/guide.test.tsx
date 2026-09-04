import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Check, Onboarding, Step } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  characterOf,
  onboardingOf,
  pending,
  speakFrench
} from '@/test-doubles'

const bridge = {
  finishOnboarding: vi.fn(pending),
  requestAuthorization: vi.fn(pending),
  openSystemPage: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const stepsWith = (checks: Partial<Record<Step, Check>>) => {
  return onboardingOf().steps.map(({ step }) => {
    return { step, check: checks[step] ?? 'unknown' }
  })
}

type ShowParams = {
  readonly agent?: string
  readonly characters?: readonly Character[]
  readonly onboarding?: Onboarding
}

const show = async ({
  agent = APPLE_AGENT,
  characters = [],
  onboarding = onboardingOf({
    done: false,
    steps: stepsWith({ authorization: 'blocked' })
  })
}: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  await speakFrench()

  const { OnboardingGuide } = await import('@/screens/onboarding/guide')
  const run = vi.fn()

  render(
    <OnboardingGuide
      onboarding={onboarding}
      characters={characters}
      run={run}
    />
  )

  return run
}

const buttonNamed = (label: string | RegExp) => {
  return screen.getByRole('button', { name: label })
}

const goTo = (label: string) => {
  fireEvent.click(buttonNamed(new RegExp(`^${label}$`, 'u')))
}

describe('la prise en main', () => {
  it('ouvre sur la bienvenue, première des six étapes', async () => {
    await show()

    expect(screen.getByText('Bienvenue dans Multifus')).not.toBeNull()
    expect(screen.getByText('Étape 1 sur 6')).not.toBeNull()
  })

  it('promet Multifus à qui n’a qu’un seul personnage', async () => {
    await show()

    expect(
      screen.getByText(/Un seul personnage ou dix/u, { exact: false })
    ).not.toBeNull()
  })

  it('mène à l’autorisation, et dit où la donner', async () => {
    await show()

    fireEvent.click(buttonNamed(/C’est parti/u))

    expect(
      screen.getByText('Laissez Multifus voir vos fenêtres')
    ).not.toBeNull()
    expect(screen.getByText('Réglages Système')).not.toBeNull()
    expect(screen.getByText('Accessibilité')).not.toBeNull()
  })

  it('dit en rouge que Multifus ne peut rien faire sans l’autorisation', async () => {
    await show()

    goTo('L’autorisation')

    const badge = screen.getByText(
      'Multifus ne voit rien, et ne peut rien faire.'
    )

    expect(badge.getAttribute('data-check')).toBe('blocked')
  })

  it('dit que Multifus voit une fois l’autorisation donnée', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready' })
      })
    })

    goTo('L’autorisation')

    expect(screen.getByText('Multifus voit vos fenêtres.')).not.toBeNull()
  })

  it('demande l’autorisation au système, et attend l’instantané', async () => {
    const run = await show()

    goTo('L’autorisation')
    fireEvent.click(buttonNamed('Autoriser Multifus'))

    expect(bridge.requestAuthorization).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('ne redemande pas une autorisation déjà donnée', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready' })
      })
    })

    goTo('L’autorisation')

    expect(
      screen.queryByRole('button', { name: 'Autoriser Multifus' })
    ).toBeNull()
  })

  it('ouvre la page du système sans attendre d’instantané', async () => {
    const run = await show()

    goTo('Les notifications')
    fireEvent.click(buttonNamed(/Ouvrir Notifications/u))

    expect(bridge.openSystemPage).toHaveBeenCalledWith('notifications')
    expect(run).not.toHaveBeenCalled()
  })

  it('nomme le jeu comme le système le nomme', async () => {
    await show()

    goTo('Les notifications')

    expect(screen.getByText('Dofus Retro')).not.toBeNull()
  })

  it('ne dit rien de ce que Multifus ne peut pas lire', async () => {
    await show()

    goTo('La concentration')

    expect(screen.queryByText(/À vous de voir/u)).toBeNull()
    expect(screen.queryByText(/Ce n’est pas en place/u)).toBeNull()
  })

  it('tient les étapes illisibles pour bonnes quand le jeu s’est fait entendre', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({
          authorization: 'ready',
          notifications: 'ready',
          focus: 'ready',
          gameSetting: 'ready',
          proof: 'ready'
        })
      })
    })

    goTo('Dans le jeu')

    expect(
      screen.getByText('C’est en place : le jeu a réussi à vous appeler.')
    ).not.toBeNull()
  })

  it('montre la case à cocher du jeu, et son chemin', async () => {
    await show()

    goTo('Dans le jeu')

    expect(
      screen.getByText('Cochez « Notifications en arrière-plan »')
    ).not.toBeNull()
    expect(screen.getByText('Options')).not.toBeNull()
    expect(screen.getByText('Général')).not.toBeNull()
    expect(screen.getByText('Divers')).not.toBeNull()
  })

  it('agrandit la capture du jeu dans une fenêtre', async () => {
    await show()

    goTo('Dans le jeu')

    const inline = screen.getByRole('img').getAttribute('src')

    fireEvent.click(buttonNamed('Voir l’image'))

    expect(screen.getByRole('img').getAttribute('src')).not.toBe(inline)
    expect(screen.getByRole('button', { name: 'Fermer' })).not.toBeNull()
  })

  it('attend qu’un personnage se connecte', async () => {
    await show()

    goTo('L’essai')

    expect(screen.getByText('Aucun personnage connecté')).not.toBeNull()
  })

  it('montre les personnages que Multifus voit', async () => {
    await show({
      characters: [
        characterOf({ nickname: 'Alpha', online: true }),
        characterOf({ nickname: 'Bravo', online: false })
      ]
    })

    goTo('L’essai')

    expect(screen.getByText('Multifus voit 1 personnage')).not.toBeNull()
    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(screen.queryByText('Bravo')).toBeNull()
  })

  it('laisse partir sans avoir entendu le jeu', async () => {
    const run = await show()

    goTo('L’essai')
    fireEvent.click(buttonNamed('Je verrai plus tard'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('se termine sur une réussite quand le jeu s’est fait entendre', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready', proof: 'ready' })
      })
    })

    goTo('L’essai')

    expect(
      screen.getByText('Le jeu vous a appelé, Multifus l’a entendu.')
    ).not.toBeNull()

    fireEvent.click(buttonNamed('Terminer'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
  })

  it('fait affirmer ce que Multifus ne peut pas lire', async () => {
    await show()

    goTo('Les notifications')

    expect(buttonNamed(/^C’est fait$/u)).not.toBeNull()
    expect(screen.queryByRole('button', { name: /^Continuer$/u })).toBeNull()
  })

  it('n’affirme rien là où Multifus lit lui-même', async () => {
    await show()

    goTo('L’autorisation')

    expect(buttonNamed(/^Continuer$/u)).not.toBeNull()
    expect(screen.queryByRole('button', { name: /^C’est fait$/u })).toBeNull()
  })

  it('se passe d’un bout à l’autre', async () => {
    await show()

    fireEvent.click(buttonNamed('Passer'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
  })

  it('parle des notifications, et non des fenêtres, sur Windows', async () => {
    await show({ agent: WINDOWS_AGENT })

    goTo('L’autorisation')

    expect(
      screen.getByText('Laissez Multifus lire les notifications')
    ).not.toBeNull()
    expect(
      screen.getByText('Multifus n’entend rien, et ne peut rien faire.')
    ).not.toBeNull()
  })
})
