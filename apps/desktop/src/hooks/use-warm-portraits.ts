import React from 'react'
import { CLASS_PORTRAITS } from '@/constants/classes'

export const useWarmPortraits = () => {
  React.useEffect(() => {
    for (const byGender of Object.values(CLASS_PORTRAITS)) {
      for (const source of Object.values(byGender)) {
        const portrait = new Image()

        portrait.src = source
      }
    }
  }, [])
}
