import { msg } from '@lingui/core/macro'
import type { AboutLink } from '@/@types/about'
import forum from '@/assets/ankama/tolerance-forum.webp'
import post from '@/assets/ankama/tolerance-post.webp'
import type { Phrase } from '@/lib/i18n'

type ToleranceProof = {
  readonly link: AboutLink
  readonly shot: string
  readonly source: Phrase
}

export const TOLERANCE_PROOFS = [
  {
    link: 'forum',
    shot: forum,
    source: msg`Forum de Dofus Retro, le 1ᵉʳ avril 2026`
  },
  {
    link: 'post',
    shot: post,
    source: msg`Compte DOFUS Rétro sur X, le 10 mars 2026`
  }
] as const satisfies readonly ToleranceProof[]
