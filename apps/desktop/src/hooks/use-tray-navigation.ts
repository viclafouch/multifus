import React from 'react'
import type { ScreenName } from '@/@types/snapshot'
import { onNavigate } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useTrayNavigation = (show: (screen: ScreenName) => void) => {
  const go = React.useEffectEvent(show)

  React.useEffect(() => {
    const subscription = onNavigate((screen) => {
      go(screen)
    })

    return () => {
      subscription
        .then((unlisten) => {
          unlisten()

          return null
        })
        .catch(ignore)
    }
  }, [])
}
