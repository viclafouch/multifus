import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { ConfigProblem } from '@/@types/system'
import { strings } from '@/constants/strings'
import { ignore } from '@/lib/utils'
import { characterOf, pending, snapshotOf } from '@/test-doubles'

type TrayHandler = Parameters<typeof import('@/lib/multifus').onNavigate>[0]

const tray = {
  asked: null as TrayHandler | null
}

const bridge = {
  onSnapshot: vi.fn(),
  onNavigate: vi.fn(),
  snapshot: vi.fn(),
  bannerScreens: vi.fn(),
  dismissConfigProblem: vi.fn(pending),
  revealQuarantinedConfig: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { App } = await import('@/app')

const open = async (snapshot: Snapshot) => {
  bridge.onSnapshot.mockResolvedValue(ignore)
  bridge.snapshot.mockResolvedValue(snapshot)
  bridge.bannerScreens.mockResolvedValue([])
  bridge.onNavigate.mockImplementation(async (handle: TrayHandler) => {
    tray.asked = handle

    return ignore
  })

  render(<App />)

  await screen.findByRole('navigation')
}

const navigateTo = (name: ScreenName) => {
  fireEvent.click(screen.getByRole('button', { name: strings.nav[name] }))
}

const currentEntry = () => {
  return screen.getByRole('button', { current: 'page' }).textContent
}

type Arrival = {
  readonly name: ScreenName
  readonly mark: string
}

const ARRIVALS = [
  { name: 'shortcuts', mark: strings.shortcuts.subtitle },
  { name: 'autoFocus', mark: strings.autoFocus.subtitle },
  { name: 'walk', mark: strings.walk.subtitle },
  { name: 'relay', mark: strings.relay.subtitle },
  { name: 'settings', mark: strings.settings.subtitle },
  { name: 'about', mark: strings.about.legalTitle }
] as const satisfies readonly Arrival[]

describe('la fenêtre de Multifus', () => {
  beforeEach(() => {
    tray.asked = null
  })

  it('n’ouvre rien tant que Rust n’a pas parlé', () => {
    bridge.onSnapshot.mockImplementation(pending)
    bridge.onNavigate.mockImplementation(pending)
    bridge.snapshot.mockImplementation(pending)

    render(<App />)

    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('s’ouvre sur les personnages', async () => {
    await open(snapshotOf())

    expect(currentEntry()).toBe(strings.nav.characters)
    expect(screen.getByText(strings.characters.emptyTitle)).not.toBeNull()
  })

  it('porte les sept écrans, et la version de Multifus', async () => {
    await open(snapshotOf({ version: '1.4.2' }))

    for (const label of Object.values(strings.nav)) {
      expect(screen.getByRole('button', { name: label })).not.toBeNull()
    }

    expect(screen.getByText('v1.4.2')).not.toBeNull()
  })

  it('mène à chaque écran, et marque celui où l’on est', async () => {
    await open(snapshotOf())

    for (const { name, mark } of ARRIVALS) {
      navigateTo(name)

      expect(screen.getByText(mark)).not.toBeNull()
      expect(currentEntry()).toBe(strings.nav[name])
    }
  })

  it('revient aux personnages', async () => {
    await open(snapshotOf())

    navigateTo('settings')
    navigateTo('characters')

    expect(screen.getByText(strings.characters.emptyTitle)).not.toBeNull()
  })

  describe('le rail', () => {
    it('compte les personnages connectés', async () => {
      await open(
        snapshotOf({
          characters: [
            characterOf({ nickname: 'Alpha', online: true }),
            characterOf({ nickname: 'Bravo', online: false }),
            characterOf({ nickname: 'Charlie', online: true })
          ]
        })
      )

      expect(screen.getByText(strings.status.connected(2))).not.toBeNull()
    })

    it('dit qu’il est à l’écoute du jeu', async () => {
      await open(
        snapshotOf({ authorization: { granted: true, listening: true } })
      )

      expect(screen.getByText(strings.status.listening)).not.toBeNull()
    })

    it('dit quand l’écoute s’est interrompue', async () => {
      await open(
        snapshotOf({ authorization: { granted: true, listening: false } })
      )

      expect(screen.getByText(strings.status.notListening)).not.toBeNull()
    })

    it('dit quand l’autorisation manque', async () => {
      await open(
        snapshotOf({ authorization: { granted: false, listening: false } })
      )

      expect(screen.getByText(strings.status.denied)).not.toBeNull()
    })
  })

  describe('sans l’autorisation du système', () => {
    const denied = snapshotOf({
      authorization: { granted: false, listening: false }
    })

    it('demande le feu vert à la place des personnages', async () => {
      await open(denied)

      expect(screen.getByText(strings.authorization.title)).not.toBeNull()
      expect(screen.queryByText(strings.characters.emptyTitle)).toBeNull()
    })

    it('laisse quand même atteindre les autres écrans', async () => {
      await open(denied)

      navigateTo('settings')

      expect(screen.getByText(strings.settings.subtitle)).not.toBeNull()
    })
  })

  it('suit la barre de plateau sans qu’on ait touché au rail', async () => {
    await open(snapshotOf())

    act(() => {
      tray.asked?.('relay')
    })

    expect(screen.getByText(strings.relay.subtitle)).not.toBeNull()
    expect(currentEntry()).toBe(strings.nav.relay)
  })

  describe('l’avis sur les réglages', () => {
    it('ne dit rien quand le fichier va bien', async () => {
      await open(snapshotOf())

      expect(screen.queryByText(strings.config.dismiss)).toBeNull()
    })

    it('dit que les réglages n’ont pas pu être lus', async () => {
      const problem: ConfigProblem = {
        kind: 'unreadable',
        detail: 'permission denied'
      }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      expect(screen.getByText(strings.config.unreadableTitle)).not.toBeNull()
      expect(
        screen.queryByRole('button', { name: strings.config.reveal })
      ).toBeNull()
    })

    it('montre où le fichier mis de côté a été rangé', async () => {
      const problem: ConfigProblem = {
        kind: 'malformed',
        detail: 'expected value',
        quarantined: '/tmp/multifus.json.bad'
      }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      expect(screen.getByText(strings.config.malformedTitle)).not.toBeNull()
      expect(screen.getByText('/tmp/multifus.json.bad')).not.toBeNull()

      fireEvent.click(
        screen.getByRole('button', { name: strings.config.reveal })
      )

      expect(bridge.revealQuarantinedConfig).toHaveBeenCalledWith()
    })

    it('s’efface quand on dit avoir compris', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      fireEvent.click(
        screen.getByRole('button', { name: strings.config.dismiss })
      )

      expect(bridge.dismissConfigProblem).toHaveBeenCalledWith()
    })

    it('reste au-dessus de l’écran où l’on va', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      navigateTo('settings')

      expect(screen.getByText(strings.config.notSavedTitle)).not.toBeNull()
    })
  })

  it('porte le journal en bas, quel que soit l’écran', async () => {
    await open(snapshotOf())

    navigateTo('settings')

    expect(screen.getByText(strings.journal.title)).not.toBeNull()
    expect(screen.getByText(strings.journal.entries(0))).not.toBeNull()
  })
})
