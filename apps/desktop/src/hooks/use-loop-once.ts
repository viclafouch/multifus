import React from 'react'
import type { LoopName } from '@/@types/loop'
import type { Snapshot } from '@/@types/snapshot'
import { useLateOpening } from '@/hooks/use-late-opening'
import { setLoopSeen } from '@/lib/multifus'

type LoopOnceParams = {
  readonly loop: LoopName
  readonly isSeen: boolean
  readonly run: (action: Promise<Snapshot>) => void
}

export const useLoopOnce = ({ loop, isSeen, run }: LoopOnceParams) => {
  const opening = useLateOpening(!isSeen)
  const isSeenTold = React.useRef(false)

  const handleOpen = () => {
    opening.setIsOpen(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    opening.setIsOpen(isOpen)

    if (!isOpen && !isSeen && !isSeenTold.current) {
      isSeenTold.current = true
      run(setLoopSeen(loop))
    }
  }

  return { isOpen: opening.isOpen, handleOpen, handleOpenChange }
}
