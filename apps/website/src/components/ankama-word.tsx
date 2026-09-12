import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { AnkamaWordId } from '@/@types/ankama'
import { OutLink } from '@/components/out-link'
import { Plate } from '@/components/plate'
import {
  ANKAMA_WORD_ALTS,
  ANKAMA_WORD_NAMES,
  ANKAMA_WORDS
} from '@/constants/ankama'

const SEE_SOURCE = msg`Lire le message chez Ankama`

type AnkamaWordProps = Readonly<{
  word: AnkamaWordId
}>

export const AnkamaWord = ({ word }: AnkamaWordProps) => {
  const { i18n } = useLingui()
  const { shot, quote, href } = ANKAMA_WORDS[word]

  return (
    <Plate className="gap-5">
      <h3 className="nameplate">{i18n._(ANKAMA_WORD_NAMES[word])}</h3>
      <blockquote className="rounded-md bg-night/30 px-5 py-4 text-tale text-cream">
        « {quote} »
      </blockquote>
      <img
        src={shot}
        alt={i18n._(ANKAMA_WORD_ALTS[word])}
        loading="lazy"
        className="rule w-full rounded-md border"
      />
      <p className="text-aside">
        <OutLink href={href}>{i18n._(SEE_SOURCE)}</OutLink>
      </p>
    </Plate>
  )
}
