import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { ConfigProblem } from '@/@types/system'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { MAP_NAMES, MAPS } from '@/constants/world'
import { ignore } from '@/lib/utils'
import { characterOf, onboardingOf, pending, snapshotOf } from '@/test-doubles'

type TrayHandler = Parameters<typeof import('@/lib/multifus').onNavigate>[0]

const tray = {
  asked: null as TrayHandler | null
}

const bridge = {
  onSnapshot: vi.fn(),
  onNavigate: vi.fn(),
  onHealthAsked: vi.fn(pending),
  snapshot: vi.fn(),
  bannerScreens: vi.fn(),
  wheelDisplay: vi.fn(),
  clients: vi.fn(pending),
  watchClients: vi.fn(pending),
  onClients: vi.fn(pending),
  dismissConfigProblem: vi.fn(pending),
  dismissCheckNotice: vi.fn(pending),
  dismissSilenceNotice: vi.fn(pending),
  revealJournal: vi.fn(pending),
  revealConfig: vi.fn(pending),
  revealQuarantinedConfig: vi.fn(pending),
  closeRuneTable: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { App } = await import('@/app')

const open = async (snapshot: Snapshot) => {
  bridge.onSnapshot.mockResolvedValue(ignore)
  bridge.snapshot.mockResolvedValue(snapshot)
  bridge.bannerScreens.mockResolvedValue([])
  bridge.wheelDisplay.mockResolvedValue(null)
  bridge.onNavigate.mockImplementation(async (handle: TrayHandler) => {
    tray.asked = handle

    return ignore
  })

  render(<App />)

  await screen.findByRole('heading', { level: 1 })
}

const goBack = () => {
  const back = screen.queryByRole('button', { name: 'Retour' })

  if (back !== null) {
    fireEvent.click(back)
  }
}

const navigateTo = (name: ScreenName) => {
  goBack()
  fireEvent.click(screen.getByRole('button', { name: mapName(name) }))
}

const mapName = (name: ScreenName) => {
  return i18n._(MAP_NAMES[name])
}

const currentMap = () => {
  return screen.getByRole('heading', { level: 1 }).textContent
}

type Arrival = {
  readonly name: ScreenName
  readonly mark: string
}

const ARRIVALS = [
  { name: 'shortcuts', mark: 'Changez de personnage sans lâcher la souris.' },
  {
    name: 'quickReplies',
    mark: 'Les phrases que vous retapez tous les soirs'
  },
  { name: 'autoFocus', mark: 'Un combat, un échange, un message privé :' },
  { name: 'walk', mark: 'Un clic déplace le personnage devant vous' },
  {
    name: 'runeTable',
    mark: 'Les poids des runes par-dessus le jeu.'
  },
  {
    name: 'relay',
    mark: 'Un joueur vous écrit pendant que vous êtes ailleurs ?'
  },
  { name: 'settings', mark: 'Les réglages de Multifus :' },
  { name: 'about', mark: 'Mentions légales' }
] as const satisfies readonly Arrival[]

const silentSnapshot = () => {
  return snapshotOf({ onboarding: onboardingOf({ hasSilence: true }) })
}

describe('the Multifus window', () => {
  beforeEach(() => {
    tray.asked = null
  })

  it('opens nothing until Rust has spoken', () => {
    bridge.onSnapshot.mockImplementation(pending)
    bridge.onNavigate.mockImplementation(pending)
    bridge.snapshot.mockImplementation(pending)

    render(<App />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('opens on the home screen', async () => {
    await open(snapshotOf())

    expect(currentMap()).toBe('Multifus')
    expect(screen.getByText('0 connecté')).not.toBeNull()
  })

  it('marks the settings when a check is closed', async () => {
    await open(
      snapshotOf({
        onboarding: onboardingOf({
          steps: [{ step: 'authorization', check: 'blocked', proven: false }]
        })
      })
    )

    expect(
      screen.getByRole('button', { name: /Paramètres/u }).textContent
    ).toContain('À régler')
  })

  it('marks nothing when every check holds', async () => {
    await open(snapshotOf())

    expect(
      screen.getByRole('button', { name: /Paramètres/u }).textContent
    ).not.toContain('À régler')
  })

  it('opens only the onboarding while it is not done', async () => {
    bridge.onSnapshot.mockResolvedValue(ignore)
    bridge.onNavigate.mockResolvedValue(ignore)
    bridge.snapshot.mockResolvedValue(
      snapshotOf({ onboarding: onboardingOf({ done: false }) })
    )

    render(<App />)

    expect(
      await screen.findByText('Vous ne chercherez plus la bonne fenêtre')
    ).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'Multifus' })).toBeNull()
  })

  it('leads to every map from home, and states the version', async () => {
    await open(snapshotOf({ version: '1.4.2' }))

    for (const name of MAPS) {
      expect(screen.getByRole('button', { name: mapName(name) })).not.toBeNull()
    }

    expect(screen.getByText('v1.4.2')).not.toBeNull()
  })

  it('leads to each map, and its title says where you are', async () => {
    await open(snapshotOf())

    for (const { name, mark } of ARRIVALS) {
      navigateTo(name)

      expect(screen.getByText(mark, { exact: false })).not.toBeNull()
      expect(currentMap()).toBe(mapName(name))
    }
  })

  it('puts the reader on the title of the map you reach', async () => {
    await open(snapshotOf())

    navigateTo('settings')

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1 })
    )

    goBack()

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1 })
    )
  })

  it('closes the rune table preview on Escape, whatever screen is open', async () => {
    await open(
      snapshotOf({
        runeTable: { ...snapshotOf().runeTable, previewing: true }
      })
    )

    navigateTo('settings')
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(bridge.closeRuneTable).toHaveBeenCalledExactlyOnceWith()
  })

  it('leaves Escape alone while no preview is open', async () => {
    await open(snapshotOf())

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(bridge.closeRuneTable).not.toHaveBeenCalled()
  })

  it('reopens on the screen left behind when Multifus reloads', async () => {
    await open(snapshotOf())

    navigateTo('settings')
    cleanup()
    await open(snapshotOf())

    expect(currentMap()).toBe(mapName('settings'))
  })

  it('goes back home on Escape', async () => {
    await open(snapshotOf())

    navigateTo('settings')
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(currentMap()).toBe('Multifus')
  })

  describe('the home screen', () => {
    it('counts the online characters', async () => {
      await open(
        snapshotOf({
          characters: [
            characterOf({ nickname: 'Alpha', online: true }),
            characterOf({ nickname: 'Bravo', online: false }),
            characterOf({ nickname: 'Charlie', online: true })
          ]
        })
      )

      expect(screen.getByText('2 connectés')).not.toBeNull()
    })

    it('says it is listening to the game', async () => {
      await open(
        snapshotOf({
          authorization: { granted: true, listening: true }
        })
      )

      expect(screen.getByText('À l’écoute du jeu')).not.toBeNull()
    })

    it('says when the listening has stopped', async () => {
      await open(
        snapshotOf({
          authorization: { granted: true, listening: false }
        })
      )

      expect(screen.getByText('Écoute interrompue')).not.toBeNull()
    })

    it('says when the authorization is missing', async () => {
      await open(
        snapshotOf({
          authorization: { granted: false, listening: false }
        })
      )

      expect(screen.getByText('Autorisation manquante')).not.toBeNull()
    })
  })

  describe('without the system authorization', () => {
    const denied = snapshotOf({
      authorization: { granted: false, listening: false }
    })

    it('asks for the authorization instead of the characters', async () => {
      await open(denied)

      navigateTo('characters')

      expect(
        screen.getByText('Multifus attend votre autorisation')
      ).not.toBeNull()
      expect(screen.queryByText('Votre roster est vide')).toBeNull()
    })

    it('still lets the other screens be reached', async () => {
      await open(denied)

      navigateTo('settings')

      expect(
        screen.getByText(
          'Les réglages de Multifus : son démarrage, et ce qu’il change sur vos clients Dofus.'
        )
      ).not.toBeNull()
    })
  })

  it('follows the tray without any panel being touched', async () => {
    await open(snapshotOf())

    act(() => {
      tray.asked?.('relay')
    })

    expect(
      screen.getByText(/Un joueur vous écrit pendant que vous êtes ailleurs/u)
    ).not.toBeNull()
    expect(currentMap()).toBe('Messages privés')
  })

  describe('the notice about the settings', () => {
    it('says nothing when the file is fine', async () => {
      await open(snapshotOf())

      expect(screen.queryByText('J’ai compris')).toBeNull()
    })

    it('says the settings could not be read', async () => {
      const problem: ConfigProblem = {
        kind: 'unreadable',
        detail: 'permission denied'
      }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      expect(
        screen.getByText('Vos réglages n’ont pas pu être lus')
      ).not.toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Montrer le fichier' })
      ).toBeNull()
    })

    it('shows where the set aside file was put', async () => {
      const problem: ConfigProblem = {
        kind: 'malformed',
        detail: 'expected value',
        quarantined: '/tmp/multifus.json.bad'
      }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      expect(
        screen.getByText('Vos réglages ont été mis de côté')
      ).not.toBeNull()
      expect(screen.getByText('/tmp/multifus.json.bad')).not.toBeNull()

      fireEvent.click(
        screen.getByRole('button', { name: 'Montrer le fichier' })
      )

      expect(bridge.revealQuarantinedConfig).toHaveBeenCalledWith()
    })

    it('goes away when you say you understood', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

      expect(bridge.dismissConfigProblem).toHaveBeenCalledWith()
    })

    it('stays above the screen you go to', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      navigateTo('settings')

      expect(
        screen.getByText('Vos réglages n’ont pas été enregistrés')
      ).not.toBeNull()
    })
  })

  it('carries the journal at the bottom, whatever the screen', async () => {
    await open(snapshotOf())

    navigateTo('settings')

    expect(screen.getByText('Journal')).not.toBeNull()
    expect(screen.getByText('0 entrée')).not.toBeNull()
  })
})

describe('the notice about a closed check', () => {
  it('says nothing when no read setting is closed', async () => {
    await open(snapshotOf())

    expect(screen.queryByText('L’AutoFocus ne peut pas marcher')).toBeNull()
  })

  it('says AutoFocus cannot work', async () => {
    await open(snapshotOf({ onboarding: onboardingOf({ hasNotice: true }) }))

    expect(screen.getByText('L’AutoFocus ne peut pas marcher')).not.toBeNull()
  })

  it('leads to the settings, and stays while nothing is fixed', async () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView')

    await open(snapshotOf({ onboarding: onboardingOf({ hasNotice: true }) }))

    fireEvent.click(screen.getByRole('button', { name: 'Régler' }))

    expect(currentMap()).toBe('Paramètres')
    expect(bridge.dismissCheckNotice).not.toHaveBeenCalled()
    expect(screen.getByText('L’AutoFocus ne peut pas marcher')).not.toBeNull()
    expect(scrolled.mock.contexts).toStrictEqual([
      document.querySelector(`#${ONBOARDING_ANCHOR}`)
    ])
  })

  it('goes away when you say you understood', async () => {
    await open(snapshotOf({ onboarding: onboardingOf({ hasNotice: true }) }))

    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    expect(bridge.dismissCheckNotice).toHaveBeenCalledWith()
  })
})

describe('the notice about an ear that stayed deaf', () => {
  it('says nothing while Multifus hears the game', async () => {
    await open(snapshotOf())

    expect(
      screen.queryByText('Multifus n’a rien entendu depuis longtemps')
    ).toBeNull()
  })

  it('says nothing has reached it for a long time', async () => {
    await open(silentSnapshot())

    expect(
      screen.getByText('Multifus n’a rien entendu depuis longtemps')
    ).not.toBeNull()
  })

  it('leads to the settings', async () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView')

    await open(silentSnapshot())

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(currentMap()).toBe('Paramètres')
    expect(bridge.dismissSilenceNotice).not.toHaveBeenCalled()
    expect(scrolled.mock.contexts).toStrictEqual([
      document.querySelector(`#${ONBOARDING_ANCHOR}`)
    ])
  })

  it('goes away when you say you understood', async () => {
    await open(silentSnapshot())

    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    expect(bridge.dismissSilenceNotice).toHaveBeenCalledWith()
  })
})
