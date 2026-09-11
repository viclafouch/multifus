import React from 'react'
import { matchIsStill, matchIsStillOnServer, watchStill } from '@/lib/motion'

export const useStill = () => {
  return React.useSyncExternalStore(
    watchStill,
    matchIsStill,
    matchIsStillOnServer
  )
}
