import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { strings } from '@/constants/strings'
import { pending } from '@/test-doubles'

const bridge = {
  requestAuthorization: vi.fn(pending),
  openAuthorizationSettings: vi.fn(pending)
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

describe('l’écran de l’autorisation', () => {
  it('dit ce que Multifus ne peut pas faire sans elle', () => {
    show()

    expect(screen.getByText(strings.authorization.title)).not.toBeNull()
    expect(screen.getByText(strings.authorization.body)).not.toBeNull()
  })

  it('prévient que l’écran s’en ira tout seul', () => {
    show()

    expect(screen.getByText(strings.authorization.patience)).not.toBeNull()
  })

  it('demande l’autorisation au système, et attend l’instantané', () => {
    const run = show()

    fireEvent.click(buttonNamed(strings.authorization.request))

    expect(bridge.requestAuthorization).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('ouvre les réglages du système sans attendre d’instantané', () => {
    const run = show()

    fireEvent.click(buttonNamed(strings.authorization.openSettings))

    expect(bridge.openAuthorizationSettings).toHaveBeenCalledWith()
    expect(run).not.toHaveBeenCalled()
  })

  it('ne casse pas quand les réglages refusent de s’ouvrir', () => {
    bridge.openAuthorizationSettings.mockRejectedValueOnce(
      new Error('aucun panneau à ouvrir')
    )

    show()

    expect(() => {
      fireEvent.click(buttonNamed(strings.authorization.openSettings))
    }).not.toThrow()
  })
})
