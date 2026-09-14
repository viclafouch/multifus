import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { matchHasLoop } from '@/helpers/page'

export const useLoopCarriedIn = () => {
  const router = useRouter()

  // oxlint-disable-next-line react/hook-use-state -- la réponse est figée au montage, elle n'a pas de setter
  const [isCarriedIn] = React.useState(() => {
    const from = router.state.resolvedLocation?.pathname

    if (from === undefined || from === router.state.location.pathname) {
      return false
    }

    return matchHasLoop(from)
  })

  return isCarriedIn
}
