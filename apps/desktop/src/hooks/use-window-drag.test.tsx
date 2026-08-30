import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DRAG_THRESHOLD, useWindowDrag } from '@/hooks/use-window-drag'

const POINTER = 7

type RuneTableProps = {
  readonly onMove: (byX: number, byY: number) => void
  readonly onSettle: () => void
}

const RuneTable = ({ onMove, onSettle }: RuneTableProps) => {
  const drag = useWindowDrag({ onMove, onSettle })

  return (
    <div {...drag} role="group" aria-label="Tableau des runes">
      <button
        type="button"
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
      >
        La croix
      </button>
    </div>
  )
}

const table = () => {
  return screen.getByRole('group', { name: 'Tableau des runes' })
}

const press = (screenX: number, screenY: number) => {
  return fireEvent.pointerDown(table(), {
    button: 0,
    pointerId: POINTER,
    screenX,
    screenY
  })
}

const drag = (screenX: number, screenY: number) => {
  fireEvent.pointerMove(table(), { pointerId: POINTER, screenX, screenY })
}

const release = (screenX: number, screenY: number) => {
  fireEvent.pointerUp(table(), { pointerId: POINTER, screenX, screenY })
}

const show = () => {
  const onMove = vi.fn<(byX: number, byY: number) => void>()
  const onSettle = vi.fn<() => void>()
  const { unmount } = render(<RuneTable onMove={onMove} onSettle={onSettle} />)

  return { onMove, onSettle, unmount }
}

describe('le tirage d’une fenêtre posée', () => {
  it('déplace de ce que la souris a parcouru', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(120, 140)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith(20, 40)
    })
  })

  it('rattrape les quatre premiers points, pour ne pas traîner derrière la souris', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(112, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(12, 0)
    })
  })

  it('ne compte que l’écart au point de départ, jamais le chemin parcouru', () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(103, 100)
    drag(100, 100)
    drag(103, 100)
    drag(100, 100)
    release(100, 100)

    expect(onMove).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })

  it('ne lâche plus la souris une fois le seuil passé, même revenue au départ', async () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(200, 100)
    drag(100, 100)
    release(100, 100)

    await waitFor(() => {
      expect(onSettle).toHaveBeenCalledExactlyOnceWith()
    })

    const travelled = onMove.mock.calls.reduce((total, [byX]) => {
      return total + byX
    }, 0)

    expect(travelled).toBe(0)
  })

  it('lâche le tableau d’une page qui s’en va au milieu du geste', () => {
    const { onSettle, unmount } = show()

    press(100, 100)
    drag(200, 100)
    unmount()

    expect(onSettle).toHaveBeenCalledExactlyOnceWith()
  })

  it('n’enregistre rien d’une page qui s’en va sans que rien ait bougé', () => {
    const { onSettle, unmount } = show()

    press(100, 100)
    unmount()

    expect(onSettle).not.toHaveBeenCalled()
  })

  it('ne bouge rien sous le seuil, et ne l’enregistre pas', () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(100 + DRAG_THRESHOLD - 1, 100)
    release(100 + DRAG_THRESHOLD - 1, 100)

    expect(onMove).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })

  it('enregistre la place une fois la souris lâchée', async () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(160, 100)
    release(160, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(60, 0)
    })
    expect(onSettle).toHaveBeenCalledExactlyOnceWith()
  })

  it('n’appelle Rust qu’une fois par image, quoi qu’il arrive à la souris', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(110, 100)
    drag(120, 100)
    drag(130, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(30, 0)
    })
  })

  it('prend le pointeur, et le rend une fois lâché', () => {
    show()

    press(100, 100)

    expect(table().hasPointerCapture(POINTER)).toBe(true)

    drag(160, 100)
    release(160, 100)

    expect(table().hasPointerCapture(POINTER)).toBe(false)
  })

  it('laisse le clic à ce qui arrête la propagation', () => {
    const { onMove } = show()

    fireEvent.pointerDown(screen.getByRole('button'), {
      button: 0,
      pointerId: POINTER,
      screenX: 100,
      screenY: 100
    })
    drag(200, 200)

    expect(onMove).not.toHaveBeenCalled()
    expect(table().hasPointerCapture(POINTER)).toBe(false)
  })

  it('ne répond qu’au bouton gauche', () => {
    const { onMove } = show()

    fireEvent.pointerDown(table(), {
      button: 2,
      pointerId: POINTER,
      screenX: 100,
      screenY: 100
    })
    drag(200, 200)

    expect(onMove).not.toHaveBeenCalled()
  })

  it('coupe au navigateur ce qu’il ferait du clic, la sélection du texte comprise', () => {
    show()

    expect(press(100, 100)).toBe(false)
  })

  it('laisse le navigateur faire du clic ce qu’il veut, hors du bouton gauche', () => {
    show()

    const answered = fireEvent.pointerDown(table(), {
      button: 2,
      pointerId: POINTER,
      screenX: 100,
      screenY: 100
    })

    expect(answered).toBe(true)
  })

  it('oublie le tirage quand le système reprend le pointeur', async () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(160, 100)
    fireEvent.pointerCancel(table(), { pointerId: POINTER })
    drag(400, 100)

    await waitFor(() => {
      expect(onSettle).toHaveBeenCalledExactlyOnceWith()
    })
    expect(onMove).toHaveBeenCalledExactlyOnceWith(60, 0)
  })
})
