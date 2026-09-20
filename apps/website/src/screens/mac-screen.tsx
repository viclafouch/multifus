import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { DesktopTowerIcon } from '@phosphor-icons/react/dist/ssr/DesktopTower'
import { KeyIcon } from '@phosphor-icons/react/dist/ssr/Key'
import type { PageScreenProps } from '@/@types/screen'
import { Answer } from '@/components/answer'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { PageBody } from '@/components/page-body'
import { PageKin } from '@/components/page-kin'
import { Question } from '@/components/question'
import { SystemStage } from '@/components/system-stage'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { QUESTIONS } from '@/constants/questions'
import { MAC_SHOT, MAC_SHOT_ALT } from '@/constants/shots'
import { QUESTIONS_TITLE } from '@/constants/wording'

export const MacScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      <SystemStage page={page} shot={MAC_SHOT} alt={MAC_SHOT_ALT} isBare />
      {body === null ? null : <PageBody body={body} />}
      <Band className="reveal gap-7 pt-10 pb-20">
        <BandTitle>{i18n._(QUESTIONS_TITLE)}</BandTitle>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          <li className="reveal">
            <Question ask={QUESTIONS.macFloor.ask} icon={DesktopIcon}>
              <Answer lines={QUESTIONS.macFloor.answer} />
              <p>
                <Trans>
                  Pour lire votre version : menu{' '}
                  <AppleLogoIcon
                    weight="fill"
                    className="inline size-4 align-[-0.15em]"
                    aria-hidden
                  />
                  <span className="sr-only">Pomme</span>, puis À propos de ce
                  Mac.
                </Trans>
              </p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.monterey.ask} icon={DesktopTowerIcon}>
              <Answer lines={QUESTIONS.monterey.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.macAccess.ask} icon={KeyIcon}>
              <Answer lines={QUESTIONS.macAccess.answer} />
            </Question>
          </li>
        </ul>
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
