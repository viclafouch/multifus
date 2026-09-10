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
  throw new Error('le tableau des runes a lâché')
}

const drawBroken = () => {
  vi.spyOn(console, 'error').mockImplementation(ignore)

  return render(
    <QuietBoundary>
      <Broken />
    </QuietBoundary>
  )
}

describe('la barrière des fenêtres sans bord', () => {
  it('laisse passer ce qu’on lui confie tant que rien ne lève', () => {
    render(
      <QuietBoundary>
        <p>Les poids des runes</p>
      </QuietBoundary>
    )

    expect(screen.getByText('Les poids des runes')).not.toBeNull()
  })

  it('ne montre rien du tout quand un rendu lève', () => {
    const { container } = drawBroken()

    expect(container.textContent).toBe('')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('écrit au journal ce que l’erreur disait', () => {
    drawBroken()

    expect(bridge.screenStopped).toHaveBeenCalledWith(
      'le tableau des runes a lâché'
    )
  })
})
