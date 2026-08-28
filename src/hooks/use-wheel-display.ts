import React from 'react'
import type { Display } from '@/@types/display'
import { wheelDisplay } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useWheelDisplay = () => {
  const [screen, setScreen] = React.useState<Display | null>(null)

  React.useEffect(() => {
    let isLive = true

    wheelDisplay().then((found) => {
      if (isLive) {
        setScreen(found)
      }
    }, ignore)

    return () => {
      isLive = false
    }
  }, [])

  return screen
}
