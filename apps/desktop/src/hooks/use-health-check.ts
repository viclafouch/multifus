import React from 'react'
import type { Snapshot } from '@/@types/snapshot'
import { READING_FLOOR_MS } from '@/constants/health'
import { checkHealth } from '@/lib/multifus'
import { errorMessage } from '@/lib/utils'

export type HealthRead =
  | { readonly kind: 'reading' }
  | { readonly kind: 'read' }
  | { readonly kind: 'failed'; readonly detail: string }

const READING: HealthRead = { kind: 'reading' }

const READ: HealthRead = { kind: 'read' }

const heldFor = async (delay: number) => {
  return new Promise((settle) => {
    setTimeout(settle, delay)
  })
}

const relit = async () => {
  const [snapshot] = await Promise.all([
    checkHealth(),
    heldFor(READING_FLOOR_MS)
  ])

  return snapshot
}

export const useHealthCheck = (run: (action: Promise<Snapshot>) => void) => {
  const [read, setRead] = React.useState<HealthRead>(READING)
  const isLive = React.useRef(true)

  const start = React.useEffectEvent(() => {
    const reading = relit()

    run(reading)

    reading.then(
      () => {
        if (isLive.current) {
          setRead(READ)
        }

        return null
      },
      (error: unknown) => {
        if (isLive.current) {
          setRead({ kind: 'failed', detail: errorMessage(error) })
        }

        return null
      }
    )
  })

  React.useEffect(() => {
    isLive.current = true

    start()

    return () => {
      isLive.current = false
    }
  }, [])

  const readAgain = () => {
    setRead(READING)
    start()
  }

  return { read, readAgain }
}
