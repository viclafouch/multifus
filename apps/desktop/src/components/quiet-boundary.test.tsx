import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ignore } from '@/lib/utils'
import { pending } from '@/test-doubles'

const bridge = {
  screenStopped: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { QuietBoundary } = await import('@/components/quiet-boundary')

const Broken = () => {
  throw new Error('the rune table gave up')
}

const drawBroken = () => {
  vi.spyOn(console, 'error').mockImplementation(ignore)

  return render(
    <QuietBoundary>
      <Broken />
    </QuietBoundary>
  )
}

describe('the boundary of the borderless windows', () => {
  it('lets through what it is given while nothing throws', () => {
    render(
      <QuietBoundary>
        <p>Les poids des runes</p>
      </QuietBoundary>
    )

    expect(screen.getByText('Les poids des runes')).not.toBeNull()
  })

  it('shows nothing at all when a render throws', () => {
    const { container } = drawBroken()

    expect(container.textContent).toBe('')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('writes to the journal what the error said', () => {
    drawBroken()

    expect(bridge.screenStopped).toHaveBeenCalledWith('the rune table gave up')
  })
})
