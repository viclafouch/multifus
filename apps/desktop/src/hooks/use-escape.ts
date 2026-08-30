import React from 'react'

export const useEscape = (isListening: boolean, onEscape: () => void) => {
  const struck = React.useRef(onEscape)

  React.useEffect(() => {
    struck.current = onEscape
  }, [onEscape])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isListening && event.key === 'Escape') {
        struck.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isListening])
}
