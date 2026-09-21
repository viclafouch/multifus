import React from 'react'

export const useHashOpen = () => {
  React.useEffect(() => {
    const openWanted = () => {
      const wanted = window.location.hash.slice(1)

      if (wanted === '') {
        return
      }

      const found = document.querySelector(`#${CSS.escape(wanted)}`)

      if (found instanceof HTMLDetailsElement) {
        found.open = true
      }
    }

    openWanted()
    window.addEventListener('hashchange', openWanted)

    return () => {
      window.removeEventListener('hashchange', openWanted)
    }
  }, [])
}
