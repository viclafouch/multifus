import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DownloadCall } from '@/components/download-call'
import { LoopPlate } from '@/components/loop-plate'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { PlateBlock } from '@/components/plate-block'
import { Prose } from '@/components/prose'
import { Vignette } from '@/components/vignette'
import { WayLink } from '@/components/way-link'
import { MENU_FEATURES } from '@/constants/pages'
import { FOLD_ANCHOR, REPOSITORY } from '@/constants/site'
import {
  BEFORE_INSTALL,
  LIMITS_TITLE,
  NO_HARM,
  PAGE_NAMES
} from '@/constants/wording'

const HERO_LEAD = msg`Jouez en multicompte`

const HERO_TURN = msg`sans chercher une fenêtre`

const HERO_UNDER = msg`Multifus amène devant vous la fenêtre du personnage qui joue sur Dofus Retro. Vous gardez les mains sur le jeu, et la team suit.`

const FEATURES_TITLE = msg`Ce que Multifus fait`

const FEATURES_LEAD = msg`Six mécanismes, un seul but : ne plus chercher le personnage qui vous attend.`

const TRUST_PROOF = msg`Le paquet est signé par Apple, le code est ouvert, et Ankama tolère ce genre d’outil tant qu’il ne touche pas au jeu. Les trois se vérifient.`

const SOURCE = msg`Voir le code`

const LOOP_CAPTION = msg`Les six mécanismes à l’œuvre dans le jeu`

const COMPARISON_LEAD = msg`Six gestionnaires de fenêtres, ligne par ligne. Chaque case est relevée dans le code, pas sur la page d’accueil de son auteur.`

export const HomeScreen = (_props: PageScreenProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <Band
        id={FOLD_ANCHOR}
        className="marquee grid gap-x-12 gap-y-12 pt-12 pb-20"
      >
        <div className="flex flex-col gap-8">
          <h1 className="surface-1 headline limelight max-w-lintel text-balance">
            <span className="text-cream">{i18n._(HERO_LEAD)}</span>{' '}
            <span className="text-leaf-lit">{i18n._(HERO_TURN)}</span>
          </h1>
          <p className="surface-2 engraved max-w-blurb text-herald text-khaki">
            {i18n._(HERO_UNDER)}
          </p>
          <DownloadCall className="surface-3" />
        </div>
        <figure className="surface-4 flex flex-col items-stretch gap-3">
          <LoopPlate loop="home" caption={i18n._(LOOP_CAPTION)} />
          <figcaption className="engraved text-aside text-khaki">
            {i18n._(LOOP_CAPTION)}
          </figcaption>
        </figure>
      </Band>
      <Band className="reveal py-16">
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
        <Prose>{i18n._(FEATURES_LEAD)}</Prose>
        <ul className="mosaic">
          {MENU_FEATURES.map((feature) => {
            return (
              <li key={feature}>
                <Vignette page={feature} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal py-16">
        <PlateBlock title={i18n._(LIMITS_TITLE)}>
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
        <BandTitle>{i18n._(PAGE_NAMES.comparison)}</BandTitle>
        <Prose>{i18n._(COMPARISON_LEAD)}</Prose>
        <WayLink page="comparison" />
      </Band>
    </>
  )
}
