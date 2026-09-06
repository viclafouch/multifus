import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Language } from '@/@types/language'

const bridge = {
  setLanguage: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { LanguagePicker } = await import('@/components/language-picker')

const flag = (name: string) => {
  return screen.getByRole('button', { name })
}

const show = (current: Language) => {
  const user = userEvent.setup()

  render(<LanguagePicker current={current} />)

  return user
}

describe('le choix de la langue', () => {
  it('montre les trois langues, chacune nommée dans sa propre langue', () => {
    show('fr')

    expect(
      screen.getByRole('list', { name: 'La langue de Multifus' })
    ).not.toBeNull()
    expect(flag('Français')).not.toBeNull()
    expect(flag('English')).not.toBeNull()
    expect(flag('Español')).not.toBeNull()
  })

  it('marque la langue en cours, et elle seule', () => {
    show('es')

    expect(flag('Español').getAttribute('aria-pressed')).toBe('true')
    expect(flag('Français').getAttribute('aria-pressed')).toBe('false')
    expect(flag('English').getAttribute('aria-pressed')).toBe('false')
  })

  it('ne demande rien quand on reprend la langue en cours', async () => {
    const user = show('fr')

    await user.click(flag('Français'))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(bridge.setLanguage).not.toHaveBeenCalled()
  })

  it('prévient que Multifus va se recharger avant de rien changer', async () => {
    const user = show('fr')

    await user.click(flag('English'))

    expect(screen.getByText('Passer Multifus en English ?')).not.toBeNull()
    expect(bridge.setLanguage).not.toHaveBeenCalled()
  })

  it('demande au Rust la langue choisie une fois l’avertissement accepté', async () => {
    bridge.setLanguage.mockResolvedValueOnce(null)

    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })

  it('ne change rien quand on renonce', async () => {
    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(bridge.setLanguage).not.toHaveBeenCalled()
    expect(screen.queryByText('Passer Multifus en English ?')).toBeNull()
  })

  it('ne casse pas quand le Rust refuse de recharger', async () => {
    bridge.setLanguage.mockRejectedValueOnce(new Error('rien à recharger'))

    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })
})
