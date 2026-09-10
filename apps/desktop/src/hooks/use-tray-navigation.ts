import type { ScreenName } from '@/@types/snapshot'
import { useMultifusEvent } from '@/hooks/use-multifus-event'
import { onNavigate } from '@/lib/multifus'

export const useTrayNavigation = (show: (screen: ScreenName) => void) => {
  useMultifusEvent(onNavigate, show)
}
