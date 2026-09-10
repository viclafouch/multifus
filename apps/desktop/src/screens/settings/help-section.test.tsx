import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { pending, speakFrench } from '@/test-doubles'

const bridge = {
  restartOnboarding: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const show = async () => {
  await speakFrench()

  const { HelpSection } = await import('@/screens/settings/help-section')
  const run = vi.fn()

  render(<HelpSection run={run} />)

  return { run }
}

describe('le panneau du doute, sous les réglages', () => {
  it('offre les trois gestes, et ne rejoue pas le tableau des étapes', async () => {
    await show()

    expect(screen.getByText('Est-ce que tout marche ?')).not.toBeNull()
    expect(screen.getByText('Questions fréquentes')).not.toBeNull()
    expect(screen.getByText('Revoir la mise en route')).not.toBeNull()
    expect(screen.queryByText('Laissez Multifus voir vos fenêtres')).toBeNull()
  })

  it('relance la mise en route, et attend l’instantané', async () => {
    const { run } = await show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }))

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })
})
