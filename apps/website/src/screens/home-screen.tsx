import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { Button } from '@multifus/retro'
import type { PageScreenProps } from '@/@types/screen'
import { AuthorWord } from '@/components/author-word'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { BotBan } from '@/components/bot-ban'
import { DownloadCall } from '@/components/download-call'
import { FeatureCard } from '@/components/feature-card'
import { LoopPlate } from '@/components/loop-plate'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { PlateBlock } from '@/components/plate-block'
import { Prose } from '@/components/prose'
import { RivalPeek } from '@/components/rival-peek'
import { MENU_FEATURES } from '@/constants/pages'
import { FOLD_ANCHOR, REPOSITORY } from '@/constants/site'
import { BEFORE_INSTALL, LIMITS_TITLE, NO_HARM } from '@/constants/wording'
import { useLoopCarriedIn } from '@/hooks/use-loop-carried-in'

const HERO_LEAD = msg`Le multicompte sur Dofus Retro`

const HERO_TURN = msg`enfin jouable`

const FEATURES_TITLE = msg`Ce que Multifus fait`

const FEATURES_LEAD = msg`Six mécanismes, un seul but : ne plus chercher le personnage qui vous attend.`

const TRUST_TITLE = msg`Multifus est sûr, et ça se vérifie`

const TRUST_PROOF = msg`Le paquet est signé par Apple, le code est ouvert, et Ankama tolère ce genre d’outil tant qu’il ne touche pas au jeu. Les trois se vérifient.`

const SOURCE = msg`Voir le code`

const COMPARISON_TITLE = msg`Multifus face aux autres`

const COMPARISON_LEAD = msg`Dracoon, Focus Retro, Dosoft, Retro Toolbox, ROrganizer : chaque case est relevée dans le code de l’outil, pas sur sa page d’accueil.`

export const HomeScreen = (_props: PageScreenProps) => {
  const { i18n } = useLingui()
  const isCarriedIn = useLoopCarriedIn()

  return (
    <>
      <Band
        id={FOLD_ANCHOR}
        className="marquee grid gap-x-12 gap-y-12 pt-12 pb-20"
      >
        <div className="flex flex-col gap-8">
          <h1 className="surface-1 headline limelight max-w-lintel text-balance">
            <span className="text-cream">{i18n._(HERO_LEAD)}</span>
            <span className="block text-leaf-lit">{i18n._(HERO_TURN)}</span>
          </h1>
          <p className="surface-2 engraved max-w-blurb text-herald text-khaki">
            <Trans>
              Multifus amène devant vous la fenêtre du personnage qui joue sur
              Dofus Retro,{' '}
              <PageLink
                page="ankama"
                className="underline decoration-leaf-lit decoration-2 underline-offset-4"
              >
                dans le respect des règles d’Ankama
              </PageLink>
              .
            </Trans>
          </p>
          <DownloadCall className="surface-3" />
        </div>
        <div className="surface-4" data-carried={isCarriedIn ? '' : undefined}>
          <LoopPlate loop="home" isAuto />
        </div>
      </Band>
      <Band className="reveal py-16">
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
        <Prose>{i18n._(FEATURES_LEAD)}</Prose>
        <ul className="mosaic">
          {MENU_FEATURES.map((feature) => {
            return (
              <li key={feature}>
                <FeatureCard page={feature} hasPeek />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal gap-10 py-20">
        <BandTitle>{i18n._(TRUST_TITLE)}</BandTitle>
        <AuthorWord />
      </Band>
      <Band className="reveal py-16">
        <PlateBlock title={i18n._(LIMITS_TITLE)}>
          <BotBan />
          <Prose>{i18n._(NO_HARM)}</Prose>
          <Prose>{i18n._(TRUST_PROOF)}</Prose>
          <div className="flex flex-wrap items-center gap-6">
            <Button
              variant="slate"
              nativeButton={false}
              render={<PageLink page="download" isBare className="sighted" />}
            >
              {i18n._(BEFORE_INSTALL)}
            </Button>
            <OutLink href={REPOSITORY}>{i18n._(SOURCE)}</OutLink>
          </div>
        </PlateBlock>
      </Band>
      <Band className="reveal pt-16 pb-24">
        <BandTitle>{i18n._(COMPARISON_TITLE)}</BandTitle>
        <Prose>{i18n._(COMPARISON_LEAD)}</Prose>
        <RivalPeek />
      </Band>
    </>
  )
}
