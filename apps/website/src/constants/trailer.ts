import { msg } from '@lingui/core/macro'
import posterSmallEnglish from '@multifus/ankama/images/trailer-poster-760.en.webp'
import posterSmallSpanish from '@multifus/ankama/images/trailer-poster-760.es.webp'
import posterSmallFrench from '@multifus/ankama/images/trailer-poster-760.fr.webp'
import posterFullEnglish from '@multifus/ankama/images/trailer-poster.en.webp'
import posterFullSpanish from '@multifus/ankama/images/trailer-poster.es.webp'
import posterFullFrench from '@multifus/ankama/images/trailer-poster.fr.webp'
import type { Trailer } from '@/@types/page'
import { posterOf } from '@/lib/media'

export const TRAILER = {
  id: 'sJglZGX_SCg',
  posters: {
    fr: posterOf(posterFullFrench, posterSmallFrench),
    en: posterOf(posterFullEnglish, posterSmallEnglish),
    es: posterOf(posterFullSpanish, posterSmallSpanish)
  },
  seconds: 68,
  uploaded: '2026-09-28T06:00:12-07:00',
  spoken: 'fr'
} as const satisfies Trailer

export const TRAILER_TITLE = msg`Multifus : l’outil gratuit pour Dofus Retro, mono ou multicompte`
