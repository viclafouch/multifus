import React from 'react'
import { windowPainted } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

const showOnceSettled = async () => {
  await document.fonts.ready

  const decodings = Array.from(document.images, (image) => {
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

    showOnceSettled().catch(ignore)
  }, [isReady])
}
