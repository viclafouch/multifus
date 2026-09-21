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

describe('the About screen', () => {
  it('says what Multifus is and everything it can do', () => {
    show()

    expect(
      screen.getByText('Logiciel communautaire pour Dofus Retro')
    ).not.toBeNull()
    expect(
      screen.getByText(
        'Le multicompte sur Dofus Retro, sans quitter le jeu des yeux. Vos fenêtres passent devant au clavier, à la roue des personnages ou au clic, et celle qui vous appelle arrive toute seule. Un raccourci colle un texte rapide, un autre pose le tableau des runes, et vos messages privés vous rejoignent sur votre téléphone si vous reliez Telegram.'
      )
    ).not.toBeNull()
  })

  it('says the version, the system and where the settings are kept', () => {
    show({ version: '1.4.2', system: 'Windows 10.0.26100 (x64)' })

    expect(screen.getByText('1.4.2')).not.toBeNull()
    expect(screen.getByText('Windows 10.0.26100 (x64)')).not.toBeNull()
    expect(screen.getByText(CONFIG_PATH)).not.toBeNull()
  })

  it('opens the settings folder', () => {
    bridge.revealConfig.mockResolvedValue(null)
    show()

    fireEvent.click(buttonNamed('Montrer le fichier des réglages'))

    expect(bridge.revealConfig).toHaveBeenCalledWith()
  })

  describe('the project', () => {
    it('leads to the source code and to the place where a bug is told', () => {
      bridge.openAboutLink.mockResolvedValue(null)
      show()

      fireEvent.click(buttonNamed('Aller voir'))
      fireEvent.click(buttonNamed('Aller le dire'))

      expect(bridge.openAboutLink).toHaveBeenCalledWith('source')
      expect(bridge.openAboutLink).toHaveBeenCalledWith('issues')
    })

    it('reads what Ankama tolerates and the legal notice on the site', () => {
      bridge.openAboutLink.mockResolvedValue(null)
      show()

      fireEvent.click(buttonNamed('Lire les deux messages'))
      fireEvent.click(buttonNamed('Lire les mentions'))

      expect(bridge.openAboutLink).toHaveBeenCalledWith('ankama')
      expect(bridge.openAboutLink).toHaveBeenCalledWith('legal')
    })

    it('says what each page of the site holds before leaving for it', () => {
      show()

      expect(
        screen.getByText('Ce qu’elle laisse faire, et ce qui fait bannir.')
      ).not.toBeNull()
      expect(
        screen.getByText('Qui publie Multifus, et ce qui appartient à Ankama.')
      ).not.toBeNull()
    })
  })

  describe('the update', () => {
    it('goes and sees if there is one, on request', () => {
      show({ update: { kind: 'upToDate' } })

      fireEvent.click(buttonNamed('Vérifier'))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
      expect(bridge.installUpdate).not.toHaveBeenCalled()
    })

    it('says the version is the latest', () => {
      show({ update: { kind: 'upToDate' } })

      expect(screen.getByText('Vous êtes à jour.')).not.toBeNull()
    })

    it('says the check is going on', () => {
      show({ update: { kind: 'checking' } })

      expect(screen.getByText('Vérification en cours…')).not.toBeNull()
      expect(buttonNamed('Vérifier').getAttribute('aria-busy')).toBe('true')
    })

    it('offers to install the version it found', () => {
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

    it('says the download is going on', () => {
      show({ update: { kind: 'installing' } })

      expect(screen.getByText('Téléchargement en cours…')).not.toBeNull()
      expect(buttonNamed('Installer').getAttribute('aria-busy')).toBe('true')
    })

    it('says why the update did not go through, and lets it be tried again', () => {
      show({ update: { kind: 'failed', detail: 'signature invalide' } })

      expect(
        screen.getByText('La mise à jour a échoué : signature invalide')
      ).not.toBeNull()

      fireEvent.click(buttonNamed('Vérifier'))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
    })
  })

  describe('resetting everything', () => {
    it('asks for a confirmation before touching anything', () => {
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

    it('warns the Dofus characters risk nothing', () => {
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

    it('clears nothing when it is cancelled', async () => {
      show()

      fireEvent.click(buttonNamed('Tout réinitialiser'))
      fireEvent.click(buttonNamed('Annuler'))

      await waitFor(() => {
        expect(screen.queryByText('Tout remettre à neuf ?')).toBeNull()
      })
      expect(bridge.reset).not.toHaveBeenCalled()
    })

    it('asks Rust to clear everything when it is confirmed', async () => {
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
