import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { reloadScreen } from '@/lib/reload'
import { ignore } from '@/lib/utils'
import { pending } from '@/test-doubles'

const bridge = {
  revealJournal: vi.fn(pending),
  screenStopped: vi.fn(pending),
  windowPainted: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

vi.mock(import('@/lib/reload'), () => {
  return { reloadScreen: vi.fn() }
})

const { ErrorBoundary } = await import('@/components/error-boundary')

const Broken = () => {
  throw new Error('the render gave up')
}

const drawBroken = () => {
  vi.spyOn(console, 'error').mockImplementation(ignore)

  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>
  )
}

describe('the screen that replaces the white window', () => {
  it('lets through what it is given while nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>La roue tourne</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('La roue tourne')).not.toBeNull()
  })

  it('says Multifus is still running when a render throws', () => {
    drawBroken()

    expect(screen.getByRole('alert')).not.toBeNull()
    expect(screen.getByText('L’écran s’est arrêté')).not.toBeNull()
    expect(screen.getByText(/Multifus, lui, tourne toujours/u)).not.toBeNull()
  })

  it('shows the error message, the one copied into a report', () => {
    drawBroken()

    expect(screen.getByText('the render gave up')).not.toBeNull()
  })

  it('writes to the journal, which the button then offers to open', () => {
    drawBroken()

    expect(bridge.screenStopped).toHaveBeenCalledWith('the render gave up')
  })

  it('offers to reload the screen and to open the journal', () => {
    drawBroken()

    expect(
      screen.getByRole('button', { name: 'Recharger l’écran' })
    ).not.toBeNull()

    expect(
      screen.getByRole('button', { name: 'Montrer le fichier du journal' })
    ).not.toBeNull()
  })

  it('reloads the screen when asked', () => {
    drawBroken()

    fireEvent.click(screen.getByRole('button', { name: 'Recharger l’écran' }))

    expect(reloadScreen).toHaveBeenCalledWith()
  })
})
