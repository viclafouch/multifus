import { forgetMap } from '@/lib/map-memory'

export const reloadScreen = () => {
  forgetMap()
  window.location.reload()
}
