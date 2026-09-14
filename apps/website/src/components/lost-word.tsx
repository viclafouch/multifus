import { msg } from '@lingui/core/macro'
import { cn } from '@multifus/retro'
import type { Language } from '@/@types/language'
import { Glint } from '@/components/glint'
import { PageLink } from '@/components/page-link'
import type { HeadingLevel } from '@/lib/heading'
import { HEADING_TAGS } from '@/lib/heading'
import { SPEAKERS } from '@/lib/i18n'

export const LOST_TITLE = msg`Cette page n’existe pas`

export const LOST_PROMISE = msg`L’adresse est peut-être mal recopiée, ou la page a changé de nom. L’accueil vous remet sur le chemin.`

const BACK_HOME = msg`Retour à l’accueil`

export type LostLevel = Exclude<HeadingLevel, 3>

const TITLE_SIZES = {
  1: 'text-banner',
  2: 'text-passage'
} as const satisfies Record<LostLevel, string>

type LostWordProps = Readonly<{
  language: Language
  level: LostLevel
}>

export const LostWord = ({ language, level }: LostWordProps) => {
  const speaker = SPEAKERS[language]
  const Heading = HEADING_TAGS[level]

  return (
    <div lang={language} className="flex flex-col items-start gap-4">
      <Heading className={cn('surface-1 carved', TITLE_SIZES[level])}>
        {speaker._(LOST_TITLE)}
      </Heading>
      <p className="surface-2 engraved max-w-lead text-herald text-balance text-cream">
        {speaker._(LOST_PROMISE)}
      </p>
      <Glint className="surface-3" />
      <PageLink
        page="home"
        language={language}
        hrefLang={language}
        className="surface-4 tab text-deed"
      >
        {speaker._(BACK_HOME)}
      </PageLink>
    </div>
  )
}
