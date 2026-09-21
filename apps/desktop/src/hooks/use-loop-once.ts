import React from 'react'
import type { LoopName } from '@/@types/loop'
import type { Snapshot } from '@/@types/snapshot'
import { useLateOpening } from '@/hooks/use-late-opening'
import { morph } from '@/lib/morph'
import { setLoopSeen } from '@/lib/multifus'

type LoopOnceParams = {
  readonly loop: LoopName
  readonly isSeen: boolean
  readonly run: (action: Promise<Snapshot>) => void
}

export const useLoopOnce = ({ loop, isSeen, run }: LoopOnceParams) => {
  const peek = useLateOpening(!isSeen)
  const [isOpen, setIsOpen] = React.useState(false)
  const [from, setFrom] = React.useState<number | null>(null)
  const isSeenTold = React.useRef(false)

  const tellItIsSeen = () => {
    if (!isSeen && !isSeenTold.current) {
      isSeenTold.current = true
      run(setLoopSeen(loop))
    }
  }

  const handleDismiss = () => {
    peek.setIsOpen(false)
    tellItIsSeen()
  }

  const handleOpen = () => {
    peek.setIsOpen(false)
    tellItIsSeen()
    setFrom(null)
    setIsOpen(true)
  }

  const handleGrow = (start: number) => {
    tellItIsSeen()

    morph(() => {
      peek.setIsOpen(false)
      setFrom(start)
      setIsOpen(true)
    })
  }

  return {
    isPeeking: peek.isOpen,
    isOpen,
    from,
    handleOpen,
    handleGrow,
    handleDismiss,
    handleOpenChange: setIsOpen
  }
}
