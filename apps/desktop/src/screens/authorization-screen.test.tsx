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

describe('the authorization screen', () => {
  it('says what Multifus cannot do without it', () => {
    show()

    expect(
      screen.getByText('Multifus attend votre autorisation')
    ).not.toBeNull()
    expect(screen.getByText(/Multifus ne peut pas/u)).not.toBeNull()
  })

  it('warns the screen will leave on its own', () => {
    show()

    expect(screen.getByText(/cet écran disparaîtra tout seul/u)).not.toBeNull()
  })

  it('asks the system for the authorization, and waits for the snapshot', () => {
    const run = show()

    fireEvent.click(buttonNamed('Demander l’autorisation'))

    expect(bridge.requestAuthorization).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('opens the system settings without waiting for a snapshot', () => {
    const run = show()

    fireEvent.click(openSettingsButton())

    expect(bridge.openSystemPage).toHaveBeenCalledWith('authorization')
    expect(run).not.toHaveBeenCalled()
  })

  it('does not break when the settings refuse to open', () => {
    bridge.openSystemPage.mockRejectedValueOnce(new Error('no panel to open'))

    show()

    expect(() => {
      fireEvent.click(openSettingsButton())
    }).not.toThrow()
  })
})
