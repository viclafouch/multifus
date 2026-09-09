import React from 'react'
import { matchIsStill, watchStill } from '@/lib/motion'

export const useStill = () => {
  return React.useSyncExternalStore(watchStill, matchIsStill)
}
