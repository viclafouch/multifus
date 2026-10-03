import React from 'react'

export const usePointerAway = () => {
  const [isAway, setIsAway] = React.useState(false)

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsAway(true)
      }
    }

    const handlePointerMove = () => {
      setIsAway(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('pointermove', handlePointerMove)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  const leave = () => {
    setIsAway(true)
  }

  return { isAway, leave }
}
