import React from 'react'
import { useMedia } from '@/hooks/use-media'
import { WIDE } from '@/lib/media'

export const useDrawer = () => {
  const drawer = React.useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const isWide = useMedia(WIDE)

  const close = () => {
    drawer.current?.close()
  }

  React.useEffect(() => {
    if (isWide) {
      drawer.current?.close()
    }
  }, [isWide])

  const open = () => {
    drawer.current?.showModal()
    setIsOpen(true)
  }

  const handleClosed = () => {
    setIsOpen(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === drawer.current) {
      close()
    }
  }

  return { drawer, isOpen, open, close, handleClosed, handleClick }
}
