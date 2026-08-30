import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { UpdateStatus } from '@/@types/system'
import { strings } from '@/constants/strings'

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

describe('l’écran À propos', () => {
  it('dit ce qu’est Multifus', () => {
    show()

    expect(screen.getByText(strings.about.tagline)).not.toBeNull()
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

    fireEvent.click(buttonNamed(strings.about.configReveal))

    expect(bridge.revealConfig).toHaveBeenCalledWith()
  })

  it('mène chaque mention légale par la phrase qui compte', () => {
    show()

    for (const { lead } of strings.about.legal) {
      expect(screen.getByText(lead).tagName).toBe('STRONG')
    }
  })

  it('dit Ankama, les paquets auxquels on ne touche pas, et internet', () => {
    show()

    const said = strings.about.legal
      .map(({ lead, body }) => {
        return `${lead} ${body}`
      })
      .join(' ')

    for (const owned of ['Ankama', 'mémoire', 'paquets', 'clics']) {
      expect(said).toContain(owned)
    }
  })

  it('dit que Telegram ne part qu’à la demande', () => {
    show()

    const telegram = strings.about.legal.find(({ body }) => {
      return body.includes('Telegram')
    })

    expect(telegram?.body).toContain('seulement si vous')
  })

  describe('le projet', () => {
    it('mène au code source et à l’endroit où raconter un bug', () => {
      bridge.openAboutLink.mockResolvedValue(null)
      show()

      fireEvent.click(buttonNamed(strings.about.sourceOpen))
      fireEvent.click(buttonNamed(strings.about.issuesOpen))

      expect(bridge.openAboutLink).toHaveBeenCalledWith('source')
      expect(bridge.openAboutLink).toHaveBeenCalledWith('issues')
    })
  })

  describe('la mise à jour', () => {
    it('va voir s’il y en a une, à la demande', () => {
      show({ update: { kind: 'upToDate' } })

      fireEvent.click(buttonNamed(strings.about.check))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
      expect(bridge.installUpdate).not.toHaveBeenCalled()
    })

    it('dit que la version est la dernière', () => {
      show({ update: { kind: 'upToDate' } })

      expect(screen.getByText(strings.about.updateUpToDate)).not.toBeNull()
    })

    it('dit que la vérification est en cours', () => {
      show({ update: { kind: 'checking' } })

      expect(screen.getByText(strings.about.updateChecking)).not.toBeNull()
      expect(buttonNamed(strings.about.check).getAttribute('aria-busy')).toBe(
        'true'
      )
    })

    it('propose d’installer la version trouvée', () => {
      show({ update: { kind: 'available', version: '1.5.0' } })

      expect(
        screen.getByText(strings.about.updateAvailable('1.5.0'))
      ).not.toBeNull()

      fireEvent.click(buttonNamed(strings.about.install))

      expect(bridge.installUpdate).toHaveBeenCalledWith()
      expect(bridge.checkUpdate).not.toHaveBeenCalled()
    })

    it('dit que le téléchargement est en cours', () => {
      show({ update: { kind: 'installing' } })

      expect(screen.getByText(strings.about.updateInstalling)).not.toBeNull()
      expect(buttonNamed(strings.about.install).getAttribute('aria-busy')).toBe(
        'true'
      )
    })

    it('dit pourquoi la mise à jour n’a pas abouti, et laisse réessayer', () => {
      show({ update: { kind: 'failed', detail: 'signature invalide' } })

      expect(
        screen.getByText(strings.about.updateFailed('signature invalide'))
      ).not.toBeNull()

      fireEvent.click(buttonNamed(strings.about.check))

      expect(bridge.checkUpdate).toHaveBeenCalledWith()
    })
  })

  describe('tout remettre à neuf', () => {
    it('demande confirmation avant de rien toucher', () => {
      show()

      fireEvent.click(buttonNamed(strings.about.reset))

      expect(screen.getByText(strings.about.resetConfirmTitle)).not.toBeNull()
      expect(screen.getByText(strings.about.resetConfirmBody)).not.toBeNull()
      expect(bridge.reset).not.toHaveBeenCalled()
    })

    it('prévient que les personnages Dofus ne risquent rien', () => {
      show()

      expect(screen.getByText(strings.about.resetBody)).not.toBeNull()
      expect(strings.about.resetBody).toContain('Dofus Retro')
    })

    it('n’efface rien quand on annule', async () => {
      show()

      fireEvent.click(buttonNamed(strings.about.reset))
      fireEvent.click(buttonNamed(strings.about.cancel))

      await waitFor(() => {
        expect(screen.queryByText(strings.about.resetConfirmTitle)).toBeNull()
      })
      expect(bridge.reset).not.toHaveBeenCalled()
    })

    it('demande à Rust de tout effacer quand on confirme', async () => {
      show()

      fireEvent.click(buttonNamed(strings.about.reset))
      fireEvent.click(buttonNamed(strings.about.resetConfirm))

      expect(bridge.reset).toHaveBeenCalledWith()
      await waitFor(() => {
        expect(screen.queryByText(strings.about.resetConfirmTitle)).toBeNull()
      })
    })
  })
})
