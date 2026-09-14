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

describe('the panel of the doubt, under the settings', () => {
  it('offers the three moves, and does not play the table of the steps again', async () => {
    await show()

    expect(screen.getByText('Est-ce que tout marche ?')).not.toBeNull()
    expect(screen.getByText('Questions fréquentes')).not.toBeNull()
    expect(screen.getByText('Revoir la mise en route')).not.toBeNull()
    expect(screen.queryByText('Laissez Multifus voir vos fenêtres')).toBeNull()
  })

  it('starts the setup again, and waits for the snapshot', async () => {
    const { run } = await show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }))

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })
})
