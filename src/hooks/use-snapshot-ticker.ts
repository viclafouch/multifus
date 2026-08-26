import React from 'react'
import type { Snapshot } from '@/@types/snapshot'
import { snapshot } from '@/lib/multifus'

const TICK_INTERVAL = 1000

export const useSnapshotTicker = (
  isTicking: boolean,
  run: (action: Promise<Snapshot>) => void
) => {
  const latest = React.useRef(run)

  React.useEffect(() => {
    latest.current = run
  })

  React.useEffect(() => {
    const timer = isTicking
      ? window.setInterval(() => {
          latest.current(snapshot())
        }, TICK_INTERVAL)
      : null

    return () => {
      if (timer !== null) {
        window.clearInterval(timer)
      }
    }
  }, [isTicking])
}
