import type { ScreenName } from '@/@types/snapshot'
import { NAV_ITEMS } from '@/constants/navigation'

const SCREEN_KEY = 'multifus.screen'

const FIRST_SCREEN = 'characters' as const satisfies ScreenName

const memory = () => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const lastSeenScreen = (): ScreenName => {
  const stored = memory()?.getItem(SCREEN_KEY)

  for (const item of NAV_ITEMS) {
    if (item.name === stored) {
      return item.name
    }
  }

  return FIRST_SCREEN
}

export const rememberScreen = (screen: ScreenName) => {
  memory()?.setItem(SCREEN_KEY, screen)
}

export const forgetScreen = () => {
  memory()?.removeItem(SCREEN_KEY)
}
