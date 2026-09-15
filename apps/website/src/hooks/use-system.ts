import React from 'react'
import type { SystemId } from '@/@types/system'
import { SOURCE_SYSTEM } from '@/constants/systems'
import { systemOf } from '@/helpers/system'

export const useSystem = () => {
  const [system, setSystem] = React.useState<SystemId>(SOURCE_SYSTEM)

  React.useEffect(() => {
    const found = systemOf(window.navigator.userAgent)

    if (found === null) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect -- the page is prerendered once for every visitor, so the system can only be recognized after hydration, and both packages stay reachable without it through the link of the other system
    setSystem(found)
  }, [])

  return system
}
