import React from 'react'

export const IDLE_AFTER = 1250

export const useIdlePointer = (isArmed: boolean) => {
  const target = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const element = target.current
    const stop = new AbortController()
    let countdown = 0

    if (element !== null && isArmed) {
      const doze = () => {
        element.setAttribute('data-idle', '')
      }

      const wake = () => {
        element.removeAttribute('data-idle')
        window.clearTimeout(countdown)
        countdown = window.setTimeout(doze, IDLE_AFTER)
      }

      countdown = window.setTimeout(doze, IDLE_AFTER)

      element.addEventListener('pointermove', wake, {
        signal: stop.signal,
        passive: true
      })
    }

    return () => {
      stop.abort()
      window.clearTimeout(countdown)
      element?.removeAttribute('data-idle')
    }
  }, [isArmed])

  return target
}
