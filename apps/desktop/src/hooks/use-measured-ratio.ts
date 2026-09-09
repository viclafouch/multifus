import React from 'react'
import { ignore } from '@/lib/utils'

export const useMeasuredRatio = (
  target: React.RefObject<HTMLElement | null>,
  report: (ratio: number) => void
) => {
  const measured = React.useEffectEvent(report)

  React.useEffect(() => {
    const element = target.current

    if (element === null) {
      return ignore
    }

    const measure = () => {
      const box = element.getBoundingClientRect()

      if (box.width <= 0) {
        return
      }

      measured(box.height / box.width)
    }

    const observer = new ResizeObserver(measure)

    observer.observe(element)
    measure()

    return () => {
      observer.disconnect()
    }
  }, [target])
}
