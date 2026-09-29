import type React from 'react'
import type { Hole } from '@/@types/companion'
import { useMeasured } from '@/hooks/use-measured'

const holeOf = (element: HTMLElement): Hole => {
  const box = element.getBoundingClientRect()
  const room = document.documentElement

  return {
    top: box.top,
    right: room.clientWidth - box.right,
    bottom: room.clientHeight - box.bottom,
    left: box.left
  }
}

export const useMeasuredHole = (
  target: React.RefObject<HTMLElement | null>,
  report: (hole: Hole) => void
) => {
  useMeasured({ target, measure: holeOf, report })
}
