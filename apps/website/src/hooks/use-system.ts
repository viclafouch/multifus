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

    // oxlint-disable-next-line react/set-state-in-effect -- the page is prerendered: both systems are in the delivered HTML, and the one of the visitor can only be recognized after hydration, otherwise the thirty six files would carry the system of a single visitor
    setSystem(found)
  }, [])

  return system
}
