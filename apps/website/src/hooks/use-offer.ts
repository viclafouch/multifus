import React from 'react'
import type { Language } from '@/@types/language'
import { offerOf } from '@/helpers/language'
import { keep, recall } from '@/lib/keepsake'

export const OFFER_MADE = 'multifus.tongue'

export const useOffer = (current: Language) => {
  const [offered, setOffered] = React.useState<Language | null>(null)

  React.useEffect(() => {
    if (recall(OFFER_MADE) !== null) {
      return
    }

    const wanted = offerOf({ spoken: window.navigator.languages, current })

    if (wanted === null) {
      return
    }

    const kept = keep(OFFER_MADE, wanted)

    if (!kept) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect -- la page est prérendue : la proposition ne peut naître qu'après l'hydratation, sinon le HTML livré porterait la langue d'un autre visiteur
    setOffered(wanted)
  }, [current])

  const hide = () => {
    setOffered(null)
  }

  return { offered, hide }
}
