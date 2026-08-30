import React from 'react'

export const useFittedZoom = (drawn: number) => {
  React.useEffect(() => {
    const room = document.documentElement

    const fit = () => {
      if (room.clientWidth <= 0) {
        return
      }

      document.body.style.width = `${drawn}px`
      document.body.style.zoom = `${room.clientWidth / drawn}`
    }

    const observer = new ResizeObserver(fit)

    observer.observe(room)
    fit()

    return () => {
      observer.disconnect()
    }
  }, [drawn])
}
