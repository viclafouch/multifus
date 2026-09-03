import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Language } from '@/@types/language'

const bridge = {
  setLanguage: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { LanguagePicker } = await import('@/components/language-picker')

const picker = () => {
  return screen.getByRole('combobox', { name: 'La langue de Multifus' })
}

const show = (current: Language) => {
  const user = userEvent.setup()

  render(<LanguagePicker current={current} />)

  return user
}

const pick = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  fireEvent.keyDown(picker(), { key: 'ArrowDown' })

  await user.click(screen.getByRole('option', { name }))
}

describe('le choix de la langue', () => {
  it('montre la langue en cours, écrite dans sa propre langue', () => {
    show('fr')

    expect(picker().textContent).toContain('Français')
  })

  it('nomme chaque langue dans sa propre langue', () => {
    show('fr')

    fireEvent.keyDown(picker(), { key: 'ArrowDown' })

    expect(screen.getByRole('option', { name: 'Français' })).not.toBeNull()
    expect(screen.getByRole('option', { name: 'English' })).not.toBeNull()
    expect(screen.getByRole('option', { name: 'Español' })).not.toBeNull()
  })

  it('prévient que Multifus va se recharger avant de rien changer', async () => {
    const user = show('fr')

    await pick(user, 'English')

    expect(screen.getByText('Passer Multifus en English ?')).not.toBeNull()
    expect(bridge.setLanguage).not.toHaveBeenCalled()
  })

  it('demande au Rust la langue choisie une fois l’avertissement accepté', async () => {
    bridge.setLanguage.mockResolvedValueOnce(null)

    const user = show('fr')

    await pick(user, 'English')
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })

  it('ne change rien quand on renonce', async () => {
    const user = show('fr')

    await pick(user, 'English')
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(bridge.setLanguage).not.toHaveBeenCalled()
    expect(screen.queryByText('Passer Multifus en English ?')).toBeNull()
  })

  it('ne casse pas quand le Rust refuse de recharger', async () => {
    bridge.setLanguage.mockRejectedValueOnce(new Error('rien à recharger'))

    const user = show('fr')

    await pick(user, 'English')
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })
})
