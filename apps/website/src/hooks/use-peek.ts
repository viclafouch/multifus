import React from 'react'
import { useMedia } from '@/hooks/use-media'
import { HOVER, STILL } from '@/lib/media'

type PeekParams = Readonly<{
  hasPeek: boolean
}>

export const usePeek = ({ hasPeek }: PeekParams) => {
  const isHovering = useMedia(HOVER)
  const isStill = useMedia(STILL)
  const [isPointed, setIsPointed] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const isPeeking = hasPeek && isPointed && isHovering && !isStill

  const handleOpen = () => {
    setIsPointed(true)
  }

  const handleClose = () => {
    setIsPointed(false)
    setIsLoaded(false)
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return {
    isPeeking,
    isReady: isPeeking && isLoaded,
    handleLoad,
    handlers: {
      onPointerEnter: handleOpen,
      onPointerLeave: handleClose,
      onFocus: handleOpen,
      onBlur: handleClose
    }
  }
}
