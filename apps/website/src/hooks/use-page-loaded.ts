import React from 'react'

const watchLoad = (onChange: () => void) => {
  window.addEventListener('load', onChange)

  return () => {
    window.removeEventListener('load', onChange)
  }
}

const matchIsLoaded = () => {
  return document.readyState === 'complete'
}

const matchIsLoadedOnServer = () => {
  return false
}

export const usePageLoaded = () => {
  return React.useSyncExternalStore(
    watchLoad,
    matchIsLoaded,
    matchIsLoadedOnServer
  )
}
