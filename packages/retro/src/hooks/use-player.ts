import React from 'react'

type PlayerParams = Readonly<{
  isStill: boolean
  isAuto: boolean
}>

export const usePlayer = ({ isStill, isAuto }: PlayerParams) => {
  const video = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(isAuto && !isStill)

  React.useEffect(() => {
    const element = video.current

    const handlePlayback = () => {
      setIsPlaying(element !== null && !element.paused)
    }

    element?.addEventListener('play', handlePlayback)
    element?.addEventListener('pause', handlePlayback)

    if (isStill) {
      element?.pause()
    } else if (isAuto) {
      element?.play().catch(handlePlayback)
    }

    return () => {
      element?.removeEventListener('play', handlePlayback)
      element?.removeEventListener('pause', handlePlayback)
    }
  }, [isStill, isAuto])

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
