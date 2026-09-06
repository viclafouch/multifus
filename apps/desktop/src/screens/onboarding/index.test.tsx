import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { APPLE_AGENT, pending, speakFrench } from '@/test-doubles'

const bridge = {
  restartOnboarding: vi.fn(pending),
  openSystemPage: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const show = async () => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: APPLE_AGENT })

  await speakFrench()

  const { OnboardingSection } = await import('@/screens/onboarding')
  const run = vi.fn()

  render(<OnboardingSection run={run} />)

  return run
}

describe('la mise en route, sous les réglages', () => {
  it('tient en une ligne, et ne rejoue pas le tableau des étapes', async () => {
    await show()

    expect(screen.getByText('Revoir la mise en route')).not.toBeNull()
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(screen.queryByText('Laissez Multifus voir vos fenêtres')).toBeNull()
  })

  it('relance la mise en route, et attend l’instantané', async () => {
    const run = await show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }))

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })
})
