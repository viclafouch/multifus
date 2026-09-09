import React from 'react'
import { useStill } from '@/hooks/use-still'
import { ignore } from '@/lib/utils'

export const OPENING_WAIT_MS = 1200

export const useLateOpening = (isDue: boolean) => {
  const isStill = useStill()
  const [isOpen, setIsOpen] = React.useState(isDue && isStill)
  const waiting = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (!isDue || isStill) {
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
  }, [isDue, isStill])

  const show = (isShown: boolean) => {
    if (waiting.current !== null) {
      clearTimeout(waiting.current)
      waiting.current = null
    }

    setIsOpen(isShown)
  }

  return { isOpen, setIsOpen: show }
}
