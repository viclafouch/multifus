import type React from 'react'
import { useMeasured } from '@/hooks/use-measured'

const ratioOf = (element: HTMLElement) => {
  const box = element.getBoundingClientRect()

  return box.width <= 0 ? null : box.height / box.width
}

export const useMeasuredRatio = (
  target: React.RefObject<HTMLElement | null>,
  report: (ratio: number) => void
) => {
  useMeasured({ target, measure: ratioOf, report })
}
