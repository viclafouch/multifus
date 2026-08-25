import React from 'react'
import type { ScreenName } from '@/@types/snapshot'
import { onNavigate } from '@/lib/multifus'

export const useTrayNavigation = (show: (screen: ScreenName) => void) => {
  React.useEffect(() => {
    const subscription = onNavigate(show)

    return () => {
      subscription
        .then((unlisten) => {
          unlisten()

          return null
        })
        .catch(ignoreTeardownFailure)
    }
  }, [show])
}

const ignoreTeardownFailure = () => {}
