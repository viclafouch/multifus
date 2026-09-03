import React from 'react'
import { lastSeenScreen, rememberScreen } from '@/lib/screen-memory'

export const useCurrentScreen = () => {
  const [screen, setScreen] = React.useState(lastSeenScreen)

  React.useEffect(() => {
    rememberScreen(screen)
  }, [screen])

  return [screen, setScreen] as const
}
