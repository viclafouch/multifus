import React from 'react'

export const DRAG_THRESHOLD = 4

type Drag = {
  readonly pointerId: number
  readonly fromX: number
  readonly fromY: number
  readonly toX: number
  readonly toY: number
  readonly sentX: number
  readonly sentY: number
  readonly stirred: boolean
  readonly frame: number | null
}

type UseWindowDragParams = {
  readonly onMove: (byX: number, byY: number) => void
  readonly onSettle: () => void
}

export const useWindowDrag = ({ onMove, onSettle }: UseWindowDragParams) => {
  const held = React.useRef<Drag | null>(null)
  const settle = React.useRef(onSettle)

  React.useEffect(() => {
    settle.current = onSettle
  }, [onSettle])

  React.useEffect(() => {
    return () => {
      const drag = held.current

      forgetFrame(drag)

      held.current = null

      if (drag?.stirred ?? false) {
        settle.current()
      }
    }
  }, [])

  const sent = (drag: Drag) => {
    const byX = drag.toX - drag.fromX - drag.sentX
    const byY = drag.toY - drag.fromY - drag.sentY

    if (byX === 0 && byY === 0) {
      return drag
    }

    onMove(byX, byY)

    return { ...drag, sentX: drag.sentX + byX, sentY: drag.sentY + byY }
  }

  const flush = () => {
    const drag = held.current

    if (drag === null) {
      return
    }

    held.current = sent({ ...drag, frame: null })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || held.current !== null) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    held.current = {
      pointerId: event.pointerId,
      fromX: event.screenX,
      fromY: event.screenY,
      toX: event.screenX,
      toY: event.screenY,
      sentX: 0,
      sentY: 0,
      stirred: false,
      frame: null
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = held.current

    if (drag === null || drag.pointerId !== event.pointerId) {
      return
    }

    const moved = { ...drag, toX: event.screenX, toY: event.screenY }

    if (!moved.stirred && !matchIsStirred(moved)) {
      held.current = moved

      return
    }

    if (moved.frame !== null) {
      held.current = { ...moved, stirred: true }

      return
    }

    held.current = {
      ...moved,
      stirred: true,
      frame: requestAnimationFrame(() => {
        flush()
      })
    }
  }

  const letGo = (drag: Drag, event: React.PointerEvent<HTMLElement>) => {
    held.current = null

    forgetFrame(drag)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!drag.stirred) {
      return
    }

    sent(drag)
    onSettle()
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const drag = held.current

    if (drag === null || drag.pointerId !== event.pointerId) {
      return
    }

    letGo({ ...drag, toX: event.screenX, toY: event.screenY }, event)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    const drag = held.current

    if (drag === null || drag.pointerId !== event.pointerId) {
      return
    }

    letGo(drag, event)
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel
  }
}

const matchIsStirred = (drag: Drag) => {
  return (
    Math.hypot(drag.toX - drag.fromX, drag.toY - drag.fromY) >= DRAG_THRESHOLD
  )
}

const forgetFrame = (drag: Drag | null) => {
  const frame = drag?.frame ?? null

  if (frame !== null) {
    cancelAnimationFrame(frame)
  }
}
