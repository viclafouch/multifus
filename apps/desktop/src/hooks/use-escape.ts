import React from 'react'

export const useEscape = (isListening: boolean, onEscape: () => void) => {
  const strike = React.useEffectEvent(onEscape)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isListening && event.key === 'Escape') {
        strike()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isListening])
}
