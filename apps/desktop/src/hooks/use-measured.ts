import React from 'react'
import { ignore } from '@/lib/utils'

type UseMeasuredParams<Measure> = {
  readonly target: React.RefObject<HTMLElement | null>
  readonly measure: (element: HTMLElement) => Measure | null
  readonly report: (measured: Measure) => void
}

export const useMeasured = <Measure>({
  target,
  measure,
  report
}: UseMeasuredParams<Measure>) => {
  const read = React.useEffectEvent(measure)
  const tell = React.useEffectEvent(report)

  React.useEffect(() => {
    const element = target.current

    if (element === null) {
      return ignore
    }

    const measureAndTell = () => {
      const measured = read(element)

      if (measured !== null) {
        tell(measured)
      }
    }

    const observer = new ResizeObserver(measureAndTell)

    observer.observe(element)
    measureAndTell()

    return () => {
      observer.disconnect()
    }
  }, [target])
}
