import React from 'react'
import type { SystemId } from '@/@types/system'
import { useSystem } from '@/hooks/use-system'

export const usePickedSystem = () => {
  const detected = useSystem()
  const [picked, setPicked] = React.useState<SystemId | null>(null)

  return {
    shown: picked ?? detected,
    hasPicked: picked !== null,
    pick: setPicked
  }
}
