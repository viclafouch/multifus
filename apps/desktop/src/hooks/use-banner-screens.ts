import React from 'react'
import type { Display } from '@/@types/display'
import { bannerScreens } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useBannerScreens = () => {
  const [screens, setScreens] = React.useState<readonly Display[]>([])

  React.useEffect(() => {
    let isLive = true

    bannerScreens().then((found) => {
      if (isLive) {
        setScreens(found)
      }
    }, ignore)

    return () => {
      isLive = false
    }
  }, [])

  return screens
}
