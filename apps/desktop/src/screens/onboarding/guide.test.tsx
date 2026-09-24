import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import type { Check, Onboarding, Step } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import { LANGUAGES } from '@/constants/language'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  characterOf,
  onboardingOf,
  pending,
  runOnWindowsTen
} from '@/test-doubles'

const FEATURE_NAMES = [
  'L’AutoFocus',
  'La roue des personnages',
  'Le Déplacement rapide',
  'Le tableau des runes',
  'Les textes rapides',
  'Les messages privés',
  'Les raccourcis',
  'Vos personnages',
  'Les fenêtres agrandies'
]

const STEP_COUNT = onboardingOf().steps.length

const shownFeatures = () => {
  return FEATURE_NAMES.filter((name) => {
    return screen.queryByText(name) !== null
  })
}

const bridge = {
  finishOnboarding: vi.fn(pending),
  requestAuthorization: vi.fn(pending),
  openSystemPage: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const stepsWith = (checks: Partial<Record<Step, Check>>, proven = false) => {
  return onboardingOf().steps.map(({ step }) => {
    return { step, check: checks[step] ?? 'unknown', proven }
  })
}

type ShowParams = {
  readonly agent?: string
  readonly characters?: readonly Character[]
  readonly onboarding?: Onboarding
  readonly language?: Language
  readonly isWindowsTen?: boolean
  readonly speaks?: Language
}

const show = async ({
  agent = APPLE_AGENT,
  characters = [],
  onboarding = onboardingOf({
    done: false,
    steps: stepsWith({ authorization: 'blocked' })
  }),
  language = 'fr',
  isWindowsTen = false,
  speaks = 'fr'
}: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  if (isWindowsTen) {
    runOnWindowsTen()
  }

  const { speak } = await import('@/lib/i18n')

  await speak(speaks)

  const { OnboardingGuide } = await import('@/screens/onboarding/guide')
  const run = vi.fn()

  render(
    <OnboardingGuide
      onboarding={onboarding}
      characters={characters}
      language={language}
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

describe('the setup', () => {
  it('lets the language be changed before it is over', async () => {
    await show()

    expect(
      screen.getByRole('list', { name: 'La langue de Multifus' })
    ).not.toBeNull()
    expect(buttonNamed('Français').getAttribute('aria-pressed')).toBe('true')
    expect(buttonNamed('English').getAttribute('aria-pressed')).toBe('false')
  })

  it('opens on the steps to come, and counts none of them yet', async () => {
    await show()

    expect(
      screen.getByText(`${STEP_COUNT} petites étapes vous attendent`)
    ).not.toBeNull()
    expect(screen.queryByText(/^Étape /u)).toBeNull()
  })

  it('numbers a step against the count the welcome page announced', async () => {
    await show()

    goTo('L’autorisation')

    expect(screen.getByText(`Étape 1 sur ${STEP_COUNT}`)).not.toBeNull()
  })

  it('says the setup is short, and that nothing works without it', async () => {
    await show()

    expect(
      screen.getByText(/Sans elles, il ne peut rien faire/u, { exact: false })
    ).not.toBeNull()
  })

  it('keeps the features for the last page, and not the welcome one', async () => {
    await show()

    expect(screen.queryByText('L’AutoFocus')).toBeNull()
    expect(shownFeatures()).toStrictEqual([])
  })

  it('shows what Multifus can do even when the trial has not run', async () => {
    await show()

    goTo('L’essai')

    expect(shownFeatures()).toStrictEqual(FEATURE_NAMES)
  })

  it('says who the scenery belongs to', async () => {
    await show()

    expect(
      screen.getByText(/Décor © Ankama Games/u, { exact: false })
    ).not.toBeNull()
  })

  it('leads to the authorization, and says where to give it', async () => {
    await show()

    fireEvent.click(buttonNamed(/C’est parti/u))

    expect(
      screen.getByText('Laissez Multifus voir vos fenêtres')
    ).not.toBeNull()
    expect(screen.getByText('Réglages Système')).not.toBeNull()
    expect(screen.getByText('Accessibilité')).not.toBeNull()
  })

  it('puts the reader on the title of the step you reach', async () => {
    await show()

    fireEvent.click(buttonNamed(/C’est parti/u))

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1 })
    )
  })

  it('says in red that Multifus can do nothing without the authorization', async () => {
    await show()

    goTo('L’autorisation')

    const badge = screen.getByText(
      'Multifus ne voit rien, et ne peut rien faire.'
    )

    expect(badge.getAttribute('data-check')).toBe('blocked')
  })

  it('says Multifus sees once the authorization is given', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready' })
      })
    })

    goTo('L’autorisation')

    expect(screen.getByText('Multifus voit vos fenêtres.')).not.toBeNull()
  })

  it('asks the system for the authorization, and waits for the snapshot', async () => {
    const run = await show()

    goTo('L’autorisation')
    fireEvent.click(buttonNamed('Autoriser Multifus'))

    expect(bridge.requestAuthorization).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('does not ask again for an authorization already given', async () => {
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

  it('opens the system page without waiting for a snapshot', async () => {
    const run = await show()

    goTo('Les notifications')
    fireEvent.click(buttonNamed(/Ouvrir Notifications/u))

    expect(bridge.openSystemPage).toHaveBeenCalledWith('notifications')
    expect(run).not.toHaveBeenCalled()
  })

  it('names the game the way the system names it', async () => {
    await show()

    goTo('Les notifications')

    expect(screen.getByText('Dofus Retro')).not.toBeNull()
  })

  it('says nothing about what Multifus cannot read', async () => {
    await show()

    goTo('La concentration')

    expect(screen.queryByText(/À vous de voir/u)).toBeNull()
    expect(screen.queryByText(/Ce n’est pas en place/u)).toBeNull()
  })

  it('holds the unreadable steps as good when the game has made itself heard', async () => {
    await show({
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith(
          {
            authorization: 'ready',
            notifications: 'ready',
            focus: 'ready',
            gameSetting: 'ready',
            proof: 'ready'
          },
          true
        )
      })
    })

    goTo('Dans le jeu')

    expect(
      screen.getByText('C’est en place : le jeu a réussi à vous appeler.')
    ).not.toBeNull()
  })

  it('says it has read the setting when nothing has made itself heard yet', async () => {
    await show({
      agent: WINDOWS_AGENT,
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready', focus: 'ready' })
      })
    })

    goTo('La concentration')

    expect(
      screen.getByText('C’est en place : Multifus a lu le réglage.')
    ).not.toBeNull()
  })

  it('shows the checkbox of the game, and its path', async () => {
    await show()

    goTo('Dans le jeu')

    expect(
      screen.getByText('Cochez « Notifications en arrière-plan »')
    ).not.toBeNull()
    expect(screen.getByText('Options')).not.toBeNull()
    expect(screen.getByText('Général')).not.toBeNull()
    expect(screen.getByText('Divers')).not.toBeNull()
  })

  it('waits for a character to come online', async () => {
    await show()

    goTo('L’essai')

    expect(screen.getByText('Aucun personnage connecté')).not.toBeNull()
  })

  it('shows the characters Multifus sees', async () => {
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

  it('says what is left to do once the character is seen', async () => {
    await show({
      characters: [characterOf({ nickname: 'Alpha', online: true })]
    })

    goTo('L’essai')

    expect(screen.getByText('Plus qu’à vous faire appeler.')).not.toBeNull()
    expect(
      screen.getByText(
        /Recevez ensuite un message privé ou entrez en combat/u,
        { exact: false }
      )
    ).not.toBeNull()
  })

  it('lets you leave without having heard the game', async () => {
    const run = await show()

    goTo('L’essai')
    fireEvent.click(buttonNamed('Je verrai plus tard'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('ends on a success when the game has made itself heard', async () => {
    await show({
      characters: [characterOf({ nickname: 'Alpha', online: true })],
      onboarding: onboardingOf({
        done: false,
        steps: stepsWith({ authorization: 'ready', proof: 'ready' })
      })
    })

    goTo('L’essai')

    expect(screen.getByText('Tout est en place')).not.toBeNull()
    expect(
      screen.getByText('Le jeu vous a appelé, Multifus l’a entendu.')
    ).not.toBeNull()
    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(shownFeatures()).toStrictEqual(FEATURE_NAMES)

    fireEvent.click(buttonNamed('Terminer'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
  })

  it('makes you state what Multifus cannot read', async () => {
    await show()

    goTo('Les notifications')

    expect(buttonNamed(/^C’est fait$/u)).not.toBeNull()
    expect(screen.queryByRole('button', { name: /^Continuer$/u })).toBeNull()
  })

  it('states nothing where Multifus reads by itself', async () => {
    await show()

    goTo('L’autorisation')

    expect(buttonNamed(/^Continuer$/u)).not.toBeNull()
    expect(screen.queryByRole('button', { name: /^C’est fait$/u })).toBeNull()
  })

  it('goes through from one end to the other', async () => {
    await show()

    fireEvent.click(buttonNamed('Passer'))

    expect(bridge.finishOnboarding).toHaveBeenCalledWith()
  })

  it('speaks of the notifications, and not of the windows, on Windows', async () => {
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

describe('the screenshot of the game', () => {
  it('stays behind a button, for whoever asks for it', async () => {
    await show()

    goTo('Dans le jeu')

    expect(screen.queryByRole('img')).toBeNull()

    fireEvent.click(buttonNamed('Voir l’image'))

    expect(screen.getByRole('img')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fermer' })).not.toBeNull()
  })

  it.each(LANGUAGES)('is the one taken in %s', async (language) => {
    await show({ language })

    goTo('Dans le jeu')
    fireEvent.click(buttonNamed('Voir l’image'))

    expect(screen.getByRole('img').getAttribute('src')).toContain(
      `dofus-options-general.${language}`
    )
  })
})

describe('the words of Windows', () => {
  it('names the switch Windows 11 shows, on the page it hides it under', async () => {
    await show({ agent: WINDOWS_AGENT })

    goTo('La concentration')

    expect(screen.getByText('Coupez « Ne pas déranger »')).not.toBeNull()
    expect(screen.getByText('Système')).not.toBeNull()
    expect(screen.getByText('Notifications')).not.toBeNull()
  })

  it('names the screen Windows 10 shows, which is one of its own', async () => {
    await show({ agent: WINDOWS_AGENT, isWindowsTen: true })

    goTo('La concentration')

    expect(
      screen.getByText('Coupez « Assistant de concentration »')
    ).not.toBeNull()
    expect(screen.queryByText('Notifications')).toBeNull()
  })

  it('names the privacy screen the way Windows 11 writes it', async () => {
    await show({ agent: WINDOWS_AGENT })

    goTo('L’autorisation')

    expect(screen.getByText('Confidentialité et sécurité')).not.toBeNull()
  })

  it('writes the privacy screen in the case Windows 11 gives it in English', async () => {
    await show({ agent: WINDOWS_AGENT, speaks: 'en' })

    goTo('Permission')

    expect(screen.getByText('Privacy & security')).not.toBeNull()
  })

  it('points at the switch of the page, since Windows lists no desktop app', async () => {
    await show({ agent: WINDOWS_AGENT })

    goTo('L’autorisation')

    expect(
      screen.getByText(/allumez l’accès des applications à vos notifications/u)
    ).not.toBeNull()
    expect(screen.queryByText(/cochez Multifus/u)).toBeNull()
  })

  it('names the game the way Windows lists it', async () => {
    await show({ agent: WINDOWS_AGENT })

    goTo('Les notifications')

    expect(screen.getByText(/Trouvez « Dofus 1 »/u)).not.toBeNull()
  })

  it('names the notification screen the way Windows 10 writes it', async () => {
    await show({ agent: WINDOWS_AGENT, isWindowsTen: true })

    goTo('Les notifications')

    expect(screen.getByText('Actions et notifications')).not.toBeNull()
  })

  it('keeps the shorter privacy name of Windows 10', async () => {
    await show({ agent: WINDOWS_AGENT, isWindowsTen: true })

    goTo('L’autorisation')

    expect(screen.getByText('Confidentialité')).not.toBeNull()
  })
})
