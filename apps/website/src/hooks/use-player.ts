import React from 'react'

export const usePlayer = (isStill: boolean) => {
  const video = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  React.useEffect(() => {
    const element = video.current

    const handlePlayback = () => {
      setIsPlaying(element !== null && !element.paused)
    }

    element?.addEventListener('play', handlePlayback)
    element?.addEventListener('pause', handlePlayback)

    if (isStill) {
      element?.pause()
    } else {
      element?.play().catch(handlePlayback)
    }

    return () => {
      element?.removeEventListener('play', handlePlayback)
      element?.removeEventListener('pause', handlePlayback)
    }
  }, [isStill])

  const toggle = () => {
    const element = video.current

    if (element === null) {
      return
    }

    if (element.paused) {
      element.play().catch(() => {
        setIsPlaying(false)
      })

      return
    }

    element.pause()
  }

  return { video, isPlaying, toggle }
}
