import React from 'react'
import { matchIsStill } from '@/lib/motion'
import { ignore } from '@/lib/utils'

export const OPENING_WAIT_MS = 1200

export const useLateOpening = (isDue: boolean) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return isDue && matchIsStill()
  })
  const waiting = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (!isDue || matchIsStill()) {
      return ignore
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, OPENING_WAIT_MS)

    waiting.current = timer

    return () => {
      clearTimeout(timer)
      waiting.current = null
    }
  }, [isDue])

  const show = (isShown: boolean) => {
    if (waiting.current !== null) {
      clearTimeout(waiting.current)
      waiting.current = null
    }

    setIsOpen(isShown)
  }

  return { isOpen, setIsOpen: show }
}
