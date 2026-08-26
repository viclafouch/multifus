import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { UpdateStatus } from '@/@types/system'
import { strings } from '@/constants/strings'

const bridge = {
  checkUpdate: vi.fn(),
  installUpdate: vi.fn(),
  reset: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { AboutScreen } = await import('@/screens/about-screen')

const CONFIG_PATH = '/Users/joueur/Library/multifus/config.json'

type ShowParams = {
  readonly update?: UpdateStatus
  readonly version?: string
}

const show = ({
  update = { kind: 'upToDate' },
  version = '1.4.2'
}: ShowParams = {}) => {
  render(
    <AboutScreen
      version={version}
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
  it('dit la version et où sont rangés les réglages', () => {
    show({ version: '1.4.2' })

    expect(screen.getByText('1.4.2')).not.toBeNull()
    expect(screen.getByText(CONFIG_PATH)).not.toBeNull()
  })

  it('dit que Multifus ne touche pas au jeu', () => {
    show()

    expect(screen.getByText(strings.about.legalBody)).not.toBeNull()
    expect(screen.getByText(strings.about.legalScope)).not.toBeNull()
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
