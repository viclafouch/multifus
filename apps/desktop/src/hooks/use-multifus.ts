import React from 'react'
import type { Snapshot } from '@/@types/snapshot'
import * as multifus from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useMultifus = () => {
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null)

  React.useEffect(() => {
    let isLive = true
    let unlisten: (() => void) | null = null

    const subscribe = async () => {
      const stop = await multifus.onSnapshot((next) => {
        if (isLive) {
          setSnapshot(next)
        }
      })

      if (isLive) {
        unlisten = stop
      } else {
        stop()
      }

      const first = await multifus.snapshot()

      if (isLive) {
        setSnapshot((current) => {
          return current ?? first
        })
      }
    }

    subscribe().catch(ignore)

    return () => {
      isLive = false
      unlisten?.()
    }
  }, [])

  const run = (action: Promise<Snapshot>) => {
    action.then(setSnapshot, ignore)
  }

  return { snapshot, run }
}
