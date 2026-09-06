import React from 'react'
import { matchIsStill } from '@/lib/motion'
import { ignore } from '@/lib/utils'

export const OPENING_WAIT_MS = 600

export const useLateOpening = (isDue: boolean) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return isDue && matchIsStill()
  })

  React.useEffect(() => {
    if (!isDue || matchIsStill()) {
      return ignore
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, OPENING_WAIT_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [isDue])

  return { isOpen, setIsOpen }
}
