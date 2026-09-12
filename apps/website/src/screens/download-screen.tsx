import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import harbour from '@multifus/ankama/images/harbour.webp'
import type { Point as PointShape } from '@/@types/body'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DecorBand } from '@/components/decor-band'
import { DownloadTake } from '@/components/download-take'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PageLink } from '@/components/page-link'
import { Point } from '@/components/point'
import { Prose } from '@/components/prose'
import { SystemMoves } from '@/components/system-moves'
import { PAGES } from '@/constants/pages'
import { REPOSITORY } from '@/constants/site'
import { SYSTEM_IDS } from '@/constants/systems'
import { BEFORE_INSTALL, PAGE_NAMES } from '@/constants/wording'

const NO_STRINGS = msg`Sans compte, sans publicité, sans limite d’essai.`

const MOVES_TITLE = msg`Installer, c’est trois gestes`

const MOVES_LEAD = msg`Rien à régler avant de jouer : au premier lancement, Multifus vous prend par la main.`

const BEFORE_LEAD = msg`Ce marché est plein de clones, et vous avez raison de vous méfier. Voici quatre choses que vous pouvez vérifier vous-même.`

const SIGNED = {
  lead: msg`Signé par Apple.`,
  line: msg`Sur Mac, le fichier s’ouvre sans avertissement, et votre système vous dit qui l’a construit. Aucun autre outil de multicompte Dofus Retro ne le fait.`
} as const satisfies PointShape

const SEAL = {
  lead: msg`Le fichier vient bien d’ici.`,
  line: msg`GitHub pose un sceau sur chaque version publiée. Cette commande le vérifie :`
} as const satisfies PointShape

const SEAL_COMMAND = msg`gh attestation verify <fichier> --repo viclafouch/multifus`

const SOURCE = {
  lead: msg`Le code est ouvert.`,
  line: msg`Tout ce que Multifus fait se lit sur GitHub, et vous pouvez le compiler vous-même.`
} as const satisfies PointShape

const SOURCE_NAME = msg`Voir le code`

const UNTOUCHED = {
  lead: msg`Multifus ne touche pas au jeu.`,
  line: msg`Il ne lit pas sa mémoire, ne modifie aucun de ses fichiers, et il ne déplace jamais toute une team d’un coup.`
} as const satisfies PointShape

export const DownloadScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <div className="relative -mt-mast overflow-x-clip">
        <DecorBand scene={harbour} />
        <Band className="relative gap-7 pt-fall pb-28">
          <PageHead page={page} />
          <div className="surface-4">
            <DownloadTake />
          </div>
          <p className="surface-4 text-aside text-band">{i18n._(NO_STRINGS)}</p>
        </Band>
      </div>
      <Band className="reveal py-16">
        <BandTitle>{i18n._(MOVES_TITLE)}</BandTitle>
        <Prose>{i18n._(MOVES_LEAD)}</Prose>
        <ul className="grid gap-6 sm:grid-cols-2">
          {SYSTEM_IDS.map((system) => {
            return (
              <li key={system}>
                <SystemMoves system={system} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal py-16">
        <BandTitle>{i18n._(BEFORE_INSTALL)}</BandTitle>
        <Prose>{i18n._(BEFORE_LEAD)}</Prose>
        <ul className="flex flex-col gap-6">
          <Point point={SIGNED} />
          <Point point={SEAL}>
            <code className="rule block max-w-tale overflow-x-auto rounded-md border bg-night/35 px-4 py-3 font-mono text-aside text-cream">
              {i18n._(SEAL_COMMAND)}
            </code>
          </Point>
          <Point point={SOURCE}>
            <p>
              <OutLink href={REPOSITORY}>{i18n._(SOURCE_NAME)}</OutLink>
            </p>
          </Point>
          <Point point={UNTOUCHED}>
            <p>
              <PageLink page="ankama" className="rule border-b text-cream">
                {i18n._(PAGE_NAMES.ankama)}
              </PageLink>
            </p>
          </Point>
        </ul>
      </Band>
      <PageKin pages={kin} />
    </>
  )
}
