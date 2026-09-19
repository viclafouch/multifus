import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { CompassIcon } from '@phosphor-icons/react/dist/ssr/Compass'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { GiftIcon } from '@phosphor-icons/react/dist/ssr/Gift'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import type { PageScreenProps } from '@/@types/screen'
import { Answer } from '@/components/answer'
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
import { QUESTIONS } from '@/constants/questions'
import { HOME_SHOT, HOME_SHOT_ALT } from '@/constants/shots'
import { FOLD_ANCHOR } from '@/constants/site'
import { QUESTIONS_TITLE, PAGE_NAMES, PERKS } from '@/constants/wording'
import { usePickedSystem } from '@/hooks/use-picked-system'

const MOVES_TITLE = msg`Installer, c’est trois gestes`

const MOVES_LEAD = msg`Suivez les trois lignes de votre ordinateur. Il n’y a rien d’autre à faire.`

const FIRST_TITLE = msg`Et après ?`

const FIRST_LEAD = msg`Multifus s’ouvre et vous guide. Il vous montre les cases à cocher, dans votre ordinateur et dans Dofus. Deux minutes, une seule fois.`

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
          <AppShot shot={HOME_SHOT} alt={HOME_SHOT_ALT} />
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
            <Question ask={QUESTIONS.free.ask} icon={GiftIcon}>
              <Answer lines={QUESTIONS.free.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.risk.ask} icon={ShieldCheckIcon}>
              <Answer lines={QUESTIONS.risk.answer} />
              <p>
                <PageLink page="ankama" className="rule border-b text-cream">
                  {i18n._(PAGE_NAMES.ankama)}
                </PageLink>
              </p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.safe.ask} icon={SealCheckIcon}>
              <Answer lines={QUESTIONS.safe.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.machine.ask} icon={DesktopIcon}>
              <ul className="flex flex-col gap-2">
                {QUESTIONS.machine.answer.map((line) => {
                  return (
                    <li key={line.id} className="pointed">
                      {i18n._(line)}
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
