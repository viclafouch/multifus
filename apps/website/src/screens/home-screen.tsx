import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import village from '@multifus/ankama/images/village.webp'
import { Button } from '@multifus/retro'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DecorBand } from '@/components/decor-band'
import { DownloadButton } from '@/components/download-button'
import { LoopPlate } from '@/components/loop-plate'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { PlateBlock } from '@/components/plate-block'
import { Prose } from '@/components/prose'
import { WayLink } from '@/components/way-link'
import { MENU_FEATURES } from '@/constants/pages'
import { REPOSITORY } from '@/constants/site'
import {
  BEFORE_INSTALL,
  LIMITS_TITLE,
  NO_HARM,
  PAGE_NAMES
} from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

const EYEBROW = msg`Dofus Retro · macOS et Windows · Gratuit`

const HERO_LEAD = msg`Jouez en multicompte`

const HERO_TURN = msg`sans chercher une fenêtre`

const HERO_UNDER = msg`Multifus amène devant vous la fenêtre du personnage qui joue. Vous gardez les mains sur le jeu, et la team suit.`

const HERO_FLOOR = msg`Gratuit, code publié, paquet signé et notarisé.`

const FEATURES_TITLE = msg`Ce que Multifus fait`

const FEATURES_LEAD = msg`Six mécanismes, et un seul but : ne plus jamais chercher le personnage qui vous attend.`

const TRUST_PROOF = msg`Le paquet est signé et notarisé, il porte son attestation de provenance, et le code entier est publié. Ces trois-là se vérifient avant d’installer.`

const SOURCE = msg`Voir le code`

const LOOP_CAPTION = msg`L’AutoFocus à l’œuvre dans le jeu`

const COMPARISON_LEAD = msg`Six gestionnaires de fenêtres, ligne par ligne, chaque case relevée dans le code et non sur la page d’accueil de son auteur.`

export const HomeScreen = (_props: PageScreenProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <>
      <div className="relative -mt-mast overflow-x-clip">
        <DecorBand scene={village} />
        <Band className="marquee relative grid gap-x-12 gap-y-14 pt-fall pb-24">
          <div className="flex flex-col gap-8">
            <p className="surface-1 text-aside tracking-micro text-band uppercase">
              {i18n._(EYEBROW)}
            </p>
            <h1 className="surface-2 headline limelight max-w-lintel text-balance">
              <span className="text-cream">{i18n._(HERO_LEAD)}</span>{' '}
              <span className="text-leaf-lit">{i18n._(HERO_TURN)}</span>
            </h1>
            <p className="surface-3 max-w-blurb text-herald text-band">
              {i18n._(HERO_UNDER)}
            </p>
            <div className="surface-4 flex flex-col items-start gap-3">
              <DownloadButton />
              <p className="text-aside text-band">{i18n._(HERO_FLOOR)}</p>
            </div>
          </div>
          <figure className="surface-5 flex flex-col items-stretch gap-3 lg:spill">
            <div className="relative">
              <LoopPlate loop="autoFocus" caption={i18n._(LOOP_CAPTION)} />
              <div
                aria-hidden
                className="ebb pointer-events-none absolute inset-0 hidden lg:block"
              />
            </div>
            <figcaption className="text-aside text-band">
              <PageLink page="autoFocus">{i18n._(LOOP_CAPTION)}</PageLink>
            </figcaption>
          </figure>
        </Band>
      </div>
      <Band className="reveal py-20">
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
        <Prose>{i18n._(FEATURES_LEAD)}</Prose>
        <ul className="flex flex-col divide-y divide-border">
          {MENU_FEATURES.map((feature) => {
            return (
              <li key={feature}>
                <WayLink page={feature} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal py-20">
        <PlateBlock title={i18n._(LIMITS_TITLE)}>
          <Prose>{i18n._(NO_HARM)}</Prose>
          <Prose>{i18n._(TRUST_PROOF)}</Prose>
          <div className="flex flex-wrap items-center gap-6">
            <Button
              variant="slate"
              nativeButton={false}
              render={
                /* oxlint-disable-next-line anchor-has-content, control-has-associated-label -- Base UI pose les enfants du Button dans ce lien, que les deux règles lisent vide */
                <a
                  className="sighted"
                  href={pathOf({ page: 'download', language })}
                />
              }
            >
              {i18n._(BEFORE_INSTALL)}
            </Button>
            <OutLink href={REPOSITORY}>{i18n._(SOURCE)}</OutLink>
          </div>
        </PlateBlock>
      </Band>
      <Band className="reveal pt-20 pb-28">
        <BandTitle>{i18n._(PAGE_NAMES.comparison)}</BandTitle>
        <Prose>{i18n._(COMPARISON_LEAD)}</Prose>
        <WayLink page="comparison" />
      </Band>
    </>
  )
}
