import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { matchHasLoop } from '@/helpers/page'

export const useLoopCarriedIn = () => {
  const router = useRouter()

  // oxlint-disable-next-line react/hook-use-state -- the answer is frozen on mount, it has no setter
  const [isCarriedIn] = React.useState(() => {
    const from = router.state.resolvedLocation?.pathname

    if (from === undefined || from === router.state.location.pathname) {
      return false
    }

    return matchHasLoop(from)
  })

  return isCarriedIn
}
