import React from 'react'
import { windowPainted } from '@/lib/multifus'
import { ignore } from '@/lib/utils'
import { loadMaps } from '@/screens/deferred-map'

const matchIsDrawn = (image: HTMLImageElement) => {
  return getComputedStyle(image).opacity !== '0'
}

const showOnceSettled = async () => {
  await document.fonts.ready

  const decodings = Array.from(document.images)
    .filter(matchIsDrawn)
    .map((image) => {
      return image.decode().catch(ignore)
    })

  await Promise.all(decodings)
  await windowPainted()
}

export const useShowWhenPainted = (isReady: boolean) => {
  React.useEffect(() => {
    if (!isReady) {
      return
    }

    showOnceSettled().then(loadMaps, loadMaps).catch(ignore)
  }, [isReady])
}
