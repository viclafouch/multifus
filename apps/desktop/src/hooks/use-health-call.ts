import { useMultifusEvent } from '@/hooks/use-multifus-event'
import { onHealthAsked } from '@/lib/multifus'

export const useHealthCall = (ask: () => void) => {
  useMultifusEvent(onHealthAsked, ask)
}
