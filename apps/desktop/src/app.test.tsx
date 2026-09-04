import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { ConfigProblem } from '@/@types/system'
import { NAV_ITEMS } from '@/constants/navigation'
import { ignore } from '@/lib/utils'
import { characterOf, onboardingOf, pending, snapshotOf } from '@/test-doubles'

type TrayHandler = Parameters<typeof import('@/lib/multifus').onNavigate>[0]

const tray = {
  asked: null as TrayHandler | null
}

const bridge = {
  onSnapshot: vi.fn(),
  onNavigate: vi.fn(),
  snapshot: vi.fn(),
  bannerScreens: vi.fn(),
  wheelDisplay: vi.fn(),
  clients: vi.fn(pending),
  watchClients: vi.fn(pending),
  onClients: vi.fn(pending),
  dismissConfigProblem: vi.fn(pending),
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

  await screen.findByRole('navigation')
}

const navigateTo = (name: ScreenName) => {
  fireEvent.click(screen.getByRole('button', { name: navLabel(name) }))
}

const NAV_LABELS = {
  characters: 'Personnages',
  shortcuts: 'Raccourcis',
  quickReplies: 'Réponses rapides',
  autoFocus: 'AutoFocus',
  walk: 'Déplacement rapide',
  wheel: 'Roue des personnages',
  runeTable: 'Tableau des runes',
  relay: 'Messages privés',
  settings: 'Paramètres',
  about: 'À propos'
} as const satisfies Record<ScreenName, string>

const navLabel = (name: ScreenName) => {
  return NAV_LABELS[name]
}

const currentEntry = () => {
  return screen.getByRole('button', { current: 'page' }).textContent
}

type Arrival = {
  readonly name: ScreenName
  readonly mark: string
}

const ARRIVALS = [
  { name: 'shortcuts', mark: 'Changez de personnage sans lâcher la souris.' },
  {
    name: 'quickReplies',
    mark: 'Les réponses que vous retapez tous les soirs'
  },
  { name: 'autoFocus', mark: 'Vous jouez plusieurs personnages à la fois.' },
  { name: 'walk', mark: 'Un clic déplace le personnage que vous avez devant' },
  { name: 'wheel', mark: 'Maintenez vos touches dans le jeu' },
  {
    name: 'runeTable',
    mark: 'Les poids des runes, affichés par-dessus le jeu.'
  },
  {
    name: 'relay',
    mark: 'Un joueur vous écrit pendant que vous êtes ailleurs ?'
  },
  { name: 'settings', mark: 'Ce que Multifus fait pendant que vous jouez' },
  { name: 'about', mark: 'Mentions légales' }
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

    expect(currentEntry()).toBe('Personnages')
    expect(screen.getByText('Votre roster est vide')).not.toBeNull()
  })

  it('marque les paramètres quand un contrôle s’est fermé', async () => {
    await open(
      snapshotOf({
        onboarding: onboardingOf({
          steps: [{ step: 'authorization', check: 'blocked' }]
        })
      })
    )

    expect(
      screen.getByRole('button', { name: /Paramètres/u }).textContent
    ).toContain('À régler')
  })

  it('ne marque rien quand tous les contrôles tiennent', async () => {
    await open(snapshotOf())

    expect(
      screen.getByRole('button', { name: /Paramètres/u }).textContent
    ).not.toContain('À régler')
  })

  it('n’ouvre que la prise en main tant qu’elle n’est pas faite', async () => {
    bridge.onSnapshot.mockResolvedValue(ignore)
    bridge.onNavigate.mockResolvedValue(ignore)
    bridge.snapshot.mockResolvedValue(
      snapshotOf({ onboarding: onboardingOf({ done: false }) })
    )

    render(<App />)

    expect(await screen.findByText('Bienvenue dans Multifus')).not.toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('porte tous les écrans, et la version de Multifus', async () => {
    await open(snapshotOf({ version: '1.4.2' }))

    for (const item of NAV_ITEMS) {
      expect(
        screen.getByRole('button', { name: i18n._(item.label) })
      ).not.toBeNull()
    }

    expect(screen.getByText('v1.4.2')).not.toBeNull()
  })

  it('mène à chaque écran, et marque celui où l’on est', async () => {
    await open(snapshotOf())

    for (const { name, mark } of ARRIVALS) {
      navigateTo(name)

      expect(screen.getByText(mark, { exact: false })).not.toBeNull()
      expect(currentEntry()).toBe(navLabel(name))
    }
  })

  it('ferme l’aperçu du tableau des runes à Échap, quel que soit l’écran ouvert', async () => {
    await open(
      snapshotOf({
        runeTable: { ...snapshotOf().runeTable, previewing: true }
      })
    )

    navigateTo('settings')
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(bridge.closeRuneTable).toHaveBeenCalledExactlyOnceWith()
  })

  it('laisse Échap tranquille tant qu’aucun aperçu n’est ouvert', async () => {
    await open(snapshotOf())

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(bridge.closeRuneTable).not.toHaveBeenCalled()
  })

  it('rouvre sur l’écran quitté quand Multifus se recharge', async () => {
    await open(snapshotOf())

    navigateTo('settings')
    cleanup()
    await open(snapshotOf())

    expect(currentEntry()).toBe(navLabel('settings'))
  })

  it('revient aux personnages', async () => {
    await open(snapshotOf())

    navigateTo('settings')
    navigateTo('characters')

    expect(screen.getByText('Votre roster est vide')).not.toBeNull()
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

      expect(screen.getByText('2 personnages connectés')).not.toBeNull()
    })

    it('dit qu’il est à l’écoute du jeu', async () => {
      await open(
        snapshotOf({ authorization: { granted: true, listening: true } })
      )

      expect(screen.getByText('À l’écoute du jeu')).not.toBeNull()
    })

    it('dit quand l’écoute s’est interrompue', async () => {
      await open(
        snapshotOf({ authorization: { granted: true, listening: false } })
      )

      expect(screen.getByText('Écoute interrompue')).not.toBeNull()
    })

    it('dit quand l’autorisation manque', async () => {
      await open(
        snapshotOf({ authorization: { granted: false, listening: false } })
      )

      expect(screen.getByText('Autorisation manquante')).not.toBeNull()
    })
  })

  describe('sans l’autorisation du système', () => {
    const denied = snapshotOf({
      authorization: { granted: false, listening: false }
    })

    it('demande l’autorisation à la place des personnages', async () => {
      await open(denied)

      expect(
        screen.getByText('Multifus attend votre autorisation')
      ).not.toBeNull()
      expect(screen.queryByText('Votre roster est vide')).toBeNull()
    })

    it('laisse quand même atteindre les autres écrans', async () => {
      await open(denied)

      navigateTo('settings')

      expect(
        screen.getByText(
          'Ce que Multifus fait pendant que vous jouez, seul ou sur demande.'
        )
      ).not.toBeNull()
    })
  })

  it('suit la barre système sans qu’on ait touché au rail', async () => {
    await open(snapshotOf())

    act(() => {
      tray.asked?.('relay')
    })

    expect(
      screen.getByText(/Un joueur vous écrit pendant que vous êtes ailleurs/u)
    ).not.toBeNull()
    expect(currentEntry()).toBe('Messages privés')
  })

  describe('l’avis sur les réglages', () => {
    it('ne dit rien quand le fichier va bien', async () => {
      await open(snapshotOf())

      expect(screen.queryByText('J’ai compris')).toBeNull()
    })

    it('dit que les réglages n’ont pas pu être lus', async () => {
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

    it('montre où le fichier mis de côté a été rangé', async () => {
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

    it('s’efface quand on dit avoir compris', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

      expect(bridge.dismissConfigProblem).toHaveBeenCalledWith()
    })

    it('reste au-dessus de l’écran où l’on va', async () => {
      const problem: ConfigProblem = { kind: 'notSaved', detail: 'disk full' }

      await open(snapshotOf({ config: { path: '/tmp/c.json', problem } }))

      navigateTo('settings')

      expect(
        screen.getByText('Vos réglages n’ont pas été enregistrés')
      ).not.toBeNull()
    })
  })

  it('porte le journal en bas, quel que soit l’écran', async () => {
    await open(snapshotOf())

    navigateTo('settings')

    expect(screen.getByText('Journal')).not.toBeNull()
    expect(screen.getByText('0 entrée')).not.toBeNull()
  })
})
