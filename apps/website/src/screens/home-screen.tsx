import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import village from '@multifus/ankama/images/village.webp'
import { Button, Panel } from '@multifus/retro'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DecorBand } from '@/components/decor-band'
import { DownloadButton } from '@/components/download-button'
import { LoopPlate } from '@/components/loop-plate'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { Prose } from '@/components/prose'
import { WayLink } from '@/components/way-link'
import { MENU_FEATURES } from '@/constants/pages'
import { REPOSITORY } from '@/constants/site'
import {
  BEFORE_INSTALL,
  LIMITS_TITLE,
  NO_HARM,
  PAGE_NAMES,
  PAGE_PROMISES
} from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

const EYEBROW = msg`Dofus Retro · macOS et Windows · Gratuit`

const HERO_FLOOR = msg`Gratuit, code publié, paquet signé et notarisé.`

const TALLY = [
  {
    count: '7',
    label: msg`appels du jeu vous emmènent sur le bon personnage`
  },
  {
    count: '0',
    label: msg`fichier du jeu lu, modifié ou extrait`
  },
  {
    count: '2',
    label: msg`systèmes, macOS et Windows`
  },
  {
    count: '3',
    label: msg`langues, français, anglais, espagnol`
  }
] as const satisfies readonly Readonly<{
  count: string
  label: MessageDescriptor
}>[]

const FEATURES_TITLE = msg`Ce que Multifus fait`

const FEATURES_LEAD = msg`Sept mécanismes, et un seul but : ne plus jamais chercher le personnage qui vous attend.`

const TRUST_PROOF = msg`Le paquet est signé et notarisé, il porte son attestation de provenance, et le code entier est publié. Ces trois-là se vérifient avant d’installer.`

const SOURCE = msg`Voir le code`

const LOOP_CAPTION = msg`L’AutoFocus à l’œuvre dans le jeu`

const COMPARISON_LEAD = msg`Six gestionnaires de fenêtres, ligne par ligne, chaque case relevée dans le code et non sur la page d’accueil de son auteur.`

export const HomeScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <>
      <div className="relative">
        <DecorBand scene={village} />
        <Band className="relative gap-8 pt-16 pb-0">
          <p className="text-aside tracking-micro text-band uppercase">
            {i18n._(EYEBROW)}
          </p>
          <h1 className="flex flex-col gap-5">
            <span className="limelight font-carve text-banner tracking-chapter text-cream">
              Multifus
            </span>
            <span className="limelight max-w-lead text-herald text-balance text-cream">
              {i18n._(PAGE_PROMISES[page])}
            </span>
          </h1>
          <div className="flex flex-col items-start gap-3">
            <DownloadButton />
            <p className="text-aside text-band">{i18n._(HERO_FLOOR)}</p>
          </div>
          <figure className="flex flex-col items-end gap-2 pt-4">
            <LoopPlate loop="autoFocus" caption={i18n._(LOOP_CAPTION)} />
            <figcaption className="text-aside text-band">
              <PageLink page="autoFocus">{i18n._(LOOP_CAPTION)}</PageLink>
            </figcaption>
          </figure>
        </Band>
      </div>
      <Band className="gap-0 py-10">
        <ul className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          {TALLY.map((line) => {
            return (
              <li key={line.count} className="rule border-l pl-4">
                <span className="block font-carve text-chapter text-cream">
                  {line.count}
                </span>
                <span className="block text-aside text-band">
                  {i18n._(line.label)}
                </span>
              </li>
            )
          })}
        </ul>
      </Band>
      <Band>
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
        <Prose>{i18n._(FEATURES_LEAD)}</Prose>
        <ul className="flex flex-col">
          {MENU_FEATURES.map((feature) => {
            return (
              <li key={feature}>
                <WayLink page={feature} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band>
        <Panel className="flex flex-col gap-4 p-6 sm:p-8">
          <BandTitle>{i18n._(LIMITS_TITLE)}</BandTitle>
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
        </Panel>
      </Band>
      <Band className="pb-20">
        <BandTitle>{i18n._(PAGE_NAMES.comparison)}</BandTitle>
        <Prose>{i18n._(COMPARISON_LEAD)}</Prose>
        <WayLink page="comparison" />
      </Band>
    </>
  )
}
