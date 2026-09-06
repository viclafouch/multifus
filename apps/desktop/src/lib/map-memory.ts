import type { MapName } from '@/constants/world'
import { CLEARING, MAP_NAMES } from '@/constants/world'

const MAP_KEY = 'multifus.map'

const memory = () => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const matchIsMap = (candidate: string | null): candidate is MapName => {
  return candidate !== null && candidate in MAP_NAMES
}

export const lastSeenMap = (): MapName => {
  const stored = memory()?.getItem(MAP_KEY) ?? null

  return matchIsMap(stored) ? stored : CLEARING
}

export const rememberMap = (map: MapName) => {
  memory()?.setItem(MAP_KEY, map)
}

export const forgetMap = () => {
  memory()?.removeItem(MAP_KEY)
}
