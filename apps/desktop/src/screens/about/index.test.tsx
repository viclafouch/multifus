import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { UpdateStatus } from '@/@types/system'

const bridge = {
  checkUpdate: vi.fn(),
  installUpdate: vi.fn(),
  openAboutLink: vi.fn(),
  reset: vi.fn(),
  revealConfig: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { AboutScreen } = await import('@/screens/about')

const CONFIG_PATH = '/Users/joueur/Library/multifus/config.json'

type ShowParams = {
  readonly update?: UpdateStatus
  readonly version?: string
  readonly system?: string
}

const show = ({
  update = { kind: 'upToDate' },
  version = '1.4.2',
  system = 'macOS 26.0.0 (arm64)'
}: ShowParams = {}) => {
  render(
    <AboutScreen
      version={version}
      system={system}
      config={{ path: CONFIG_PATH, problem: null }}
      update={update}
      run={() => {}}
    />
  )
}

const buttonNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const LEGAL = [
  {
    lead: 'Multifus n’a rien à voir avec Ankama.',
    body: 'Dofus, Dofus Retro et les têtes de classe appartiennent à Ankama.'
  },
  {
    lead: 'Multifus ne touche pas au jeu.',
    body: 'Ni sa mémoire, ni ses fichiers, ni ses paquets : il range vos fenêtres, lit les notifications et prend vos clics.'
  },
  {
    lead: 'Rien ne quitte votre ordinateur sans vous.',
    body: 'Multifus cherche ses mises à jour, et relaie vos messages privés seulement si vous reliez Telegram.'
  }
]

describe('l’écran À propos', () => {
  it('dit ce qu’est Multifus', () => {
    show()

    expect(
      screen.getByText(
        'Le multicompte confortable sur Dofus Retro : Multifus range vos fenêtres, vous jouez.'
      )
    ).not.toBeNull()
  })

  it('dit la version, le système et où sont rangés les réglages', () => {
    show({ version: '1.4.2', system: 'Windows 10.0.26100 (x64)' })

    expect(screen.getByText('1.4.2')).not.toBeNull()
    expect(screen.getByText('Windows 10.0.26100 (x64)')).not.toBeNull()
    expect(screen.getByText(CONFIG_PATH)).not.toBeNull()
  })

  it('ouvre le dossier des réglages', () => {
    bridge.revealConfig.mockResolvedValue(null)
    show()

    fireEvent.click(buttonNamed('Montrer le fichier des réglages'))

    expect(bridge.revealConfig).toHaveBeenCalledWith()
  })

  it('mène chaque mention légale par la phrase qui compte', () => {
    show()

    for (const { lead } of LEGAL) {
      expect(screen.getByText(lead).tagName).toBe('STRONG')
    }
  })

  it('dit Ankama, les paquets auxquels on ne touche pas, et internet', () => {
    show()

    const said = LEGAL.map(({ lead, body }) => {
      return `${lead} ${body}`
    }).join(' ')

    for (const owned of ['Ankama', 'mémoire', 'paquets', 'clics']) {
      expect(said).toContain(owned)
    }
  })

  it('dit que Telegram ne part qu’à la demande', () => {
    show()

    const telegram = LEGAL.find(({ body }) => {
      return body.includes('Telegram')
    })

    expect(telegram?.body).toContain('seulement si vous')
  })

  describe('le projet', () => {
    it('mène au code source et à l’endroit où raconter un bug', () => {
      bridge.openAboutLink.mockResolvedValue(null)
      show()

      fireEvent.click(buttonNamed('Aller voir'))
      fireEvent.click(buttonNamed('Aller le dire'))

      expect(bridge.openAboutLink).toHaveBeenCalledWith('source')
      expect(bridge.openAboutLink).toHaveBeenCalledWith('issues')
    })
  })

  describe('la mise à jour', () => {
    it('va voir s’il y en a une, à la demande', () => {
      show({ update: { kind: 'upToDate' } })

      fireEvent.click(buttonNamed('Vérifier'))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
      expect(bridge.installUpdate).not.toHaveBeenCalled()
    })

    it('dit que la version est la dernière', () => {
      show({ update: { kind: 'upToDate' } })

      expect(screen.getByText('Vous êtes à jour.')).not.toBeNull()
    })

    it('dit que la vérification est en cours', () => {
      show({ update: { kind: 'checking' } })

      expect(screen.getByText('Vérification en cours…')).not.toBeNull()
      expect(buttonNamed('Vérifier').getAttribute('aria-busy')).toBe('true')
    })

    it('propose d’installer la version trouvée', () => {
      show({ update: { kind: 'available', version: '1.5.0' } })

      expect(
        screen.getByText(
          'La version 1.5.0 est prête. Multifus se relancera tout seul, sans toucher à vos clients.'
        )
      ).not.toBeNull()

      fireEvent.click(buttonNamed('Installer'))

      expect(bridge.installUpdate).toHaveBeenCalledWith()
      expect(bridge.checkUpdate).not.toHaveBeenCalled()
    })

    it('dit que le téléchargement est en cours', () => {
      show({ update: { kind: 'installing' } })

      expect(screen.getByText('Téléchargement en cours…')).not.toBeNull()
      expect(buttonNamed('Installer').getAttribute('aria-busy')).toBe('true')
    })

    it('dit pourquoi la mise à jour n’a pas abouti, et laisse réessayer', () => {
      show({ update: { kind: 'failed', detail: 'signature invalide' } })

      expect(
        screen.getByText('La mise à jour a échoué : signature invalide')
      ).not.toBeNull()

      fireEvent.click(buttonNamed('Vérifier'))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
    })
  })

  describe('tout remettre à neuf', () => {
    it('demande confirmation avant de rien toucher', () => {
      show()

      fireEvent.click(buttonNamed('Tout réinitialiser'))

      expect(screen.getByText('Tout remettre à neuf ?')).not.toBeNull()
      expect(
        screen.getByText(
          'Réglages, roster et raccourcis repartent d’origine. Vos personnages connectés reviendront dans la seconde, sans sexe ni classe.'
        )
      ).not.toBeNull()
      expect(bridge.reset).not.toHaveBeenCalled()
    })

    it('prévient que les personnages Dofus ne risquent rien', () => {
      show()

      expect(
        screen.getByText(
          'Multifus repart comme au premier lancement. Vos personnages Dofus Retro ne risquent rien.'
        )
      ).not.toBeNull()
      expect(
        'Multifus repart comme au premier lancement. Vos personnages Dofus Retro ne risquent rien.'
      ).toContain('Dofus Retro')
    })

    it('n’efface rien quand on annule', async () => {
      show()

      fireEvent.click(buttonNamed('Tout réinitialiser'))
      fireEvent.click(buttonNamed('Annuler'))

      await waitFor(() => {
        expect(screen.queryByText('Tout remettre à neuf ?')).toBeNull()
      })
      expect(bridge.reset).not.toHaveBeenCalled()
    })

    it('demande à Rust de tout effacer quand on confirme', async () => {
      show()

      fireEvent.click(buttonNamed('Tout réinitialiser'))
      fireEvent.click(buttonNamed('Réinitialiser'))

      expect(bridge.reset).toHaveBeenCalledWith()
      await waitFor(() => {
        expect(screen.queryByText('Tout remettre à neuf ?')).toBeNull()
      })
    })
  })
})
