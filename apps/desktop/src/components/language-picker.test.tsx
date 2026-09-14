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

describe('the language choice', () => {
  it('shows the three languages, each named in its own language', () => {
    show('fr')

    expect(
      screen.getByRole('list', { name: 'La langue de Multifus' })
    ).not.toBeNull()
    expect(flag('Français')).not.toBeNull()
    expect(flag('English')).not.toBeNull()
    expect(flag('Español')).not.toBeNull()
  })

  it('marks the current language, and only it', () => {
    show('es')

    expect(flag('Español').getAttribute('aria-pressed')).toBe('true')
    expect(flag('Français').getAttribute('aria-pressed')).toBe('false')
    expect(flag('English').getAttribute('aria-pressed')).toBe('false')
  })

  it('asks nothing when the current language is picked again', async () => {
    const user = show('fr')

    await user.click(flag('Français'))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(bridge.setLanguage).not.toHaveBeenCalled()
  })

  it('warns Multifus will reload before changing anything', async () => {
    const user = show('fr')

    await user.click(flag('English'))

    expect(screen.getByText('Passer Multifus en English ?')).not.toBeNull()
    expect(bridge.setLanguage).not.toHaveBeenCalled()
  })

  it('asks Rust for the chosen language once the warning is accepted', async () => {
    bridge.setLanguage.mockResolvedValueOnce(null)

    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })

  it('changes nothing when it is given up', async () => {
    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(bridge.setLanguage).not.toHaveBeenCalled()
    expect(screen.queryByText('Passer Multifus en English ?')).toBeNull()
  })

  it('does not break when Rust refuses to reload', async () => {
    bridge.setLanguage.mockRejectedValueOnce(new Error('nothing to reload'))

    const user = show('fr')

    await user.click(flag('English'))
    await user.click(screen.getByRole('button', { name: 'Changer la langue' }))

    expect(bridge.setLanguage).toHaveBeenCalledWith('en')
  })
})
