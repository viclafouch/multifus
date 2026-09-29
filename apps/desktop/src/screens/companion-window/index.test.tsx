import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { pending, snapshotOf } from '@/test-doubles'

const bridge = {
  snapshot: vi.fn(async () => {
    return snapshotOf({ companionSite: 'solomonk' })
  }),
  onSnapshot: vi.fn(async () => {
    return () => {}
  }),
  closeCompanion: vi.fn(pending),
  companionBack: vi.fn(pending),
  companionHome: vi.fn(pending),
  companionMeasured: vi.fn(pending),
  companionSettled: vi.fn(pending),
  moveCompanion: vi.fn(pending),
  stretchCompanion: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { CompanionWindow } = await import('@/screens/companion-window')

const POINTER = 5

const show = () => {
  render(<CompanionWindow />)
}

const button = (name: string) => {
  return screen.getByRole('button', { name })
}

const grip = () => {
  return screen.getByRole('separator', { name: 'Agrandir le site' })
}

const dragged = (element: Element, byX: number, byY: number) => {
  fireEvent.pointerDown(element, {
    button: 0,
    pointerId: POINTER,
    screenX: 200,
    screenY: 200
  })
  fireEvent.pointerMove(element, {
    pointerId: POINTER,
    screenX: 200 + byX,
    screenY: 200 + byY
  })
  fireEvent.pointerUp(element, {
    pointerId: POINTER,
    screenX: 200 + byX,
    screenY: 200 + byY
  })
}

describe('the frame around the companion site', () => {
  it('tells Rust the hole it leaves for the site', () => {
    show()

    expect(bridge.companionMeasured).toHaveBeenCalledWith({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    })
  })

  it('names the site it carries', async () => {
    show()

    expect(
      await screen.findByRole('heading', { name: 'Solomonk' })
    ).not.toBeNull()
  })

  it('waits for the page under a spinner that says nothing', async () => {
    show()

    await screen.findByRole('heading', { name: 'Solomonk' })

    expect(screen.getAllByText('Solomonk')).toHaveLength(1)
  })

  it('moves the window by its crown', async () => {
    show()

    dragged(await screen.findByRole('heading', { name: 'Solomonk' }), 60, 40)

    await waitFor(() => {
      expect(bridge.moveCompanion).toHaveBeenCalledWith(60, 40)
    })
    expect(bridge.stretchCompanion).not.toHaveBeenCalled()
    expect(bridge.companionSettled).toHaveBeenCalledExactlyOnceWith()
  })

  it('grows the window by its grip, and never moves it', async () => {
    show()

    dragged(grip(), 80, 120)

    await waitFor(() => {
      expect(bridge.stretchCompanion).toHaveBeenCalledWith(80, 120)
    })
    expect(bridge.moveCompanion).not.toHaveBeenCalled()
    expect(bridge.companionSettled).toHaveBeenCalledExactlyOnceWith()
  })

  it('steps back, goes home and closes, and no button drags the window', () => {
    show()

    for (const name of [
      'Page précédente',
      'Accueil du site',
      'Fermer le site'
    ]) {
      dragged(button(name), 200, 200)
      fireEvent.click(button(name))
    }

    expect(bridge.moveCompanion).not.toHaveBeenCalled()
    expect(bridge.companionBack).toHaveBeenCalledExactlyOnceWith()
    expect(bridge.companionHome).toHaveBeenCalledExactlyOnceWith()
    expect(bridge.closeCompanion).toHaveBeenCalledExactlyOnceWith()
  })
})
