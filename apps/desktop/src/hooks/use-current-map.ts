import React from 'react'
import type { MapName } from '@/constants/world'
import { lastSeenMap, rememberMap } from '@/lib/map-memory'

export const useCurrentMap = () => {
  const [map, setMap] = React.useState(lastSeenMap)

  const showMap = (next: MapName) => {
    rememberMap(next)
    setMap(next)
  }

  return [map, showMap] as const
}
