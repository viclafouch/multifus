import React from 'react'
import { wheelWiped } from '@/lib/multifus'
import { afterPaint } from '@/lib/paint'
import { ignore } from '@/lib/utils'

export const useWheelWiped = (generation: number | null) => {
  React.useEffect(() => {
    if (generation === null) {
      return ignore
    }

    return afterPaint(() => {
      wheelWiped(generation).catch(ignore)
    })
  }, [generation])
}
