import React from 'react'

const matchIsOffOnServer = () => {
  return false
}

export const useMedia = (query: string) => {
  const watch = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)

      media.addEventListener('change', onChange)

      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    [query]
  )

  const matchIsOn = React.useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  return React.useSyncExternalStore(watch, matchIsOn, matchIsOffOnServer)
}
