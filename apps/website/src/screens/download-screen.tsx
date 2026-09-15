import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { CompassIcon } from '@phosphor-icons/react/dist/ssr/Compass'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { GiftIcon } from '@phosphor-icons/react/dist/ssr/Gift'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import type { PageScreenProps } from '@/@types/screen'
import { AppShot } from '@/components/app-shot'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DownloadTake } from '@/components/download-take'
import { InstallSteps } from '@/components/install-steps'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PageLink } from '@/components/page-link'
import { PerkList } from '@/components/perk-list'
import { Plate } from '@/components/plate'
import { Prose } from '@/components/prose'
import { Question } from '@/components/question'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'
import { SYSTEM_FLOORS, SYSTEM_IDS, SYSTEM_NAMES } from '@/constants/systems'
import { PAGE_NAMES, PERKS } from '@/constants/wording'
import { usePickedSystem } from '@/hooks/use-picked-system'

const MOVES_TITLE = msg`Installer, c’est trois gestes`

const MOVES_LEAD = msg`Suivez les trois lignes de votre ordinateur. Il n’y a rien d’autre à faire.`

const FIRST_TITLE = msg`Et après ?`

const FIRST_LEAD = msg`Multifus s’ouvre et vous guide. Il vous montre les cases à cocher, dans votre ordinateur et dans Dofus. Deux minutes, une seule fois.`

const QUESTIONS_TITLE = msg`Les questions qu’on se pose`

const ASK_FREE = msg`C’est gratuit ?`

const FREE_ANSWER = msg`Oui, et pour toujours. Rien à payer, aucun compte à créer, aucune publicité. Il n’y a pas de version payante cachée derrière.`

const ASK_RISK = msg`Je risque quelque chose sur mon compte ?`

const RISK_ANSWER = msg`Multifus ne touche pas au jeu. Il ne lit rien dedans, il ne change rien dedans, et il ne joue jamais à votre place. Ankama accepte ce genre de logiciel tant qu’il reste comme ça.`

const ASK_SAFE = msg`Le fichier est sûr ?`

const SAFE_ANSWER = msg`Sur Mac, Apple vérifie le fichier avant qu’il s’ouvre, et aucun avertissement ne s’affiche. Sur Windows, votre ordinateur peut demander confirmation : Multifus est encore jeune, et Windows ne le connaît pas encore. Dans les deux cas, il ne vous demande aucune information, et n’en envoie aucune.`

const ASK_MACHINE = msg`Ça marche sur mon ordinateur ?`

export const DownloadScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]
  const { shown, pick } = usePickedSystem()

  return (
    <>
      <Band
        id={FOLD_ANCHOR}
        className="marquee grid gap-x-12 gap-y-10 pt-12 pb-16"
      >
        <div className="flex flex-col gap-7">
          <PageHead page={page} />
          <div className="surface-4">
            <DownloadTake shown={shown} onPick={pick} />
          </div>
          <div className="surface-4">
            <PerkList perks={PERKS} />
          </div>
        </div>
        <div className="unveil">
          <AppShot />
        </div>
      </Band>
      <Band className="reveal py-14">
        <BandTitle>{i18n._(MOVES_TITLE)}</BandTitle>
        <Prose>{i18n._(MOVES_LEAD)}</Prose>
        <InstallSteps key={shown} system={shown} />
      </Band>
      <Band className="reveal py-10">
        <Plate isBare className="flex-row items-start gap-6 sm:p-8">
          <span className="rosette">
            <CompassIcon weight="duotone" aria-hidden />
          </span>
          <span className="flex flex-col gap-3">
            <h2 className="nameplate">{i18n._(FIRST_TITLE)}</h2>
            <Prose>{i18n._(FIRST_LEAD)}</Prose>
          </span>
        </Plate>
      </Band>
      <Band className="reveal py-14">
        <BandTitle>{i18n._(QUESTIONS_TITLE)}</BandTitle>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          <li className="reveal">
            <Question ask={ASK_FREE} icon={GiftIcon}>
              <p>{i18n._(FREE_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_RISK} icon={ShieldCheckIcon}>
              <p>{i18n._(RISK_ANSWER)}</p>
              <p>
                <PageLink page="ankama" className="rule border-b text-cream">
                  {i18n._(PAGE_NAMES.ankama)}
                </PageLink>
              </p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_SAFE} icon={SealCheckIcon}>
              <p>{i18n._(SAFE_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_MACHINE} icon={DesktopIcon}>
              <ul className="flex flex-col gap-2">
                {SYSTEM_IDS.map((system) => {
                  return (
                    <li key={system} className="pointed">
                      <strong className="font-medium text-cream">
                        {SYSTEM_NAMES[system]}
                      </strong>{' '}
                      : {i18n._(SYSTEM_FLOORS[system])}
                    </li>
                  )
                })}
              </ul>
            </Question>
          </li>
        </ul>
      </Band>
      <PageKin pages={kin} />
    </>
  )
}
