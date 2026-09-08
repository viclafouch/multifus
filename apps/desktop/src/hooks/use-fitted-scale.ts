import React from 'react'

export const useFittedScale = (drawn: number) => {
  React.useLayoutEffect(() => {
    const room = document.documentElement

    const fit = () => {
      if (room.clientWidth <= 0) {
        return
      }

      document.body.style.width = `${drawn}px`
      document.body.style.transformOrigin = 'top left'
      document.body.style.transform = `scale(${room.clientWidth / drawn})`
    }

    const observer = new ResizeObserver(fit)

    observer.observe(room)
    fit()

    return () => {
      observer.disconnect()
    }
  }, [drawn])
}
