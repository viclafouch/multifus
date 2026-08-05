import React from 'react'
import type { Snapshot } from '@/lib/multifus'
import * as multifus from '@/lib/multifus'

/**
 * The one piece of state the interface holds.
 *
 * The listener is set up before the first read, so that a scan landing while
 * React was mounting is not lost, and the first read only applies if nothing has
 * arrived in the meantime.
 */
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

/**
 * A rejection nothing can be done about.
 *
 * No command of multifus reports its trouble this way: a save that did not go
 * through, a system that refused, they all come back inside the snapshot. A
 * rejection here means the bridge itself failed, and the window scan puts the
 * interface back in step within a few seconds.
 *
 * The other half of that failure is written down where this side cannot see it.
 * A snapshot the Rust side could not hand over is a `snapshotFailed` line in the
 * journal file, which is the one place it can be read: a journal that travels
 * inside the payload cannot report the payload not arriving.
 */
const ignore = () => {}
