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

describe('the drag of a laid window', () => {
  it('moves by what the mouse travelled', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(120, 140)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith(20, 40)
    })
  })

  it('catches up the first four points, so as not to lag behind the mouse', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(112, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(12, 0)
    })
  })

  it('counts only the gap to the starting point, never the path travelled', () => {
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

  it('stops letting go of the mouse once the threshold is passed, even back at the start', async () => {
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

  it('lets go of the table of a page that leaves in the middle of the move', () => {
    const { onSettle, unmount } = show()

    press(100, 100)
    drag(200, 100)
    unmount()

    expect(onSettle).toHaveBeenCalledExactlyOnceWith()
  })

  it('records nothing of a page that leaves without anything having moved', () => {
    const { onSettle, unmount } = show()

    press(100, 100)
    unmount()

    expect(onSettle).not.toHaveBeenCalled()
  })

  it('moves nothing under the threshold, and does not record it', () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(100 + DRAG_THRESHOLD - 1, 100)
    release(100 + DRAG_THRESHOLD - 1, 100)

    expect(onMove).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })

  it('records the place once the mouse is released', async () => {
    const { onMove, onSettle } = show()

    press(100, 100)
    drag(160, 100)
    release(160, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(60, 0)
    })
    expect(onSettle).toHaveBeenCalledExactlyOnceWith()
  })

  it('calls Rust only once per frame, whatever happens to the mouse', async () => {
    const { onMove } = show()

    press(100, 100)
    drag(110, 100)
    drag(120, 100)
    drag(130, 100)

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledExactlyOnceWith(30, 0)
    })
  })

  it('takes the pointer, and gives it back once released', () => {
    show()

    press(100, 100)

    expect(table().hasPointerCapture(POINTER)).toBe(true)

    drag(160, 100)
    release(160, 100)

    expect(table().hasPointerCapture(POINTER)).toBe(false)
  })

  it('leaves the click to whatever stops the propagation', () => {
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

  it('answers only to the left button', () => {
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

  it('cuts from the browser what it would do with the click, the text selection included', () => {
    show()

    expect(press(100, 100)).toBe(false)
  })

  it('lets the browser do what it wants with the click, outside the left button', () => {
    show()

    const answered = fireEvent.pointerDown(table(), {
      button: 2,
      pointerId: POINTER,
      screenX: 100,
      screenY: 100
    })

    expect(answered).toBe(true)
  })

  it('forgets the drag when the system takes the pointer back', async () => {
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
