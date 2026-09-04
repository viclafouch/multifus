import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { pending } from '@/test-doubles'

const bridge = {
  requestAuthorization: vi.fn(pending),
  openSystemPage: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { AuthorizationScreen } = await import('@/screens/authorization-screen')

const show = (run = vi.fn()) => {
  render(<AuthorizationScreen run={run} />)

  return run
}

const buttonNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const openSettingsButton = () => {
  return screen.getByRole('button', { name: /Ouvrir/u })
}

describe('l’écran de l’autorisation', () => {
  it('dit ce que Multifus ne peut pas faire sans elle', () => {
    show()

    expect(
      screen.getByText('Multifus attend votre autorisation')
    ).not.toBeNull()
    expect(screen.getByText(/Multifus ne peut pas/u)).not.toBeNull()
  })

  it('prévient que l’écran s’en ira tout seul', () => {
    show()

    expect(screen.getByText(/cet écran disparaîtra tout seul/u)).not.toBeNull()
  })

  it('demande l’autorisation au système, et attend l’instantané', () => {
    const run = show()

    fireEvent.click(buttonNamed('Demander l’autorisation'))

    expect(bridge.requestAuthorization).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('ouvre les réglages du système sans attendre d’instantané', () => {
    const run = show()

    fireEvent.click(openSettingsButton())

    expect(bridge.openSystemPage).toHaveBeenCalledWith('authorization')
    expect(run).not.toHaveBeenCalled()
  })

  it('ne casse pas quand les réglages refusent de s’ouvrir', () => {
    bridge.openSystemPage.mockRejectedValueOnce(
      new Error('aucun panneau à ouvrir')
    )

    show()

    expect(() => {
      fireEvent.click(openSettingsButton())
    }).not.toThrow()
  })
})
