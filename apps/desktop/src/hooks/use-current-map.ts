import React from 'react'
import { lastSeenMap, rememberMap } from '@/lib/map-memory'

export const useCurrentMap = () => {
  const [map, setMap] = React.useState(lastSeenMap)

  React.useEffect(() => {
    rememberMap(map)
  }, [map])

  return [map, setMap] as const
}
