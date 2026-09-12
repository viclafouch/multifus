import React from 'react'
import type { SystemId } from '@/@types/system'
import { SOURCE_SYSTEM } from '@/constants/systems'
import { systemOf } from '@/helpers/system'

export const useSystem = () => {
  const [system, setSystem] = React.useState<SystemId>(SOURCE_SYSTEM)

  React.useEffect(() => {
    const found = systemOf(window.navigator.userAgent)

    if (found === null) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect -- la page est prérendue : les deux systèmes sont dans le HTML livré, et celui du visiteur ne peut se reconnaître qu'après l'hydratation, sinon les trente-six fichiers porteraient le système d'un seul visiteur
    setSystem(found)
  }, [])

  return system
}
