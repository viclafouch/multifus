import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { BellRingingIcon } from '@phosphor-icons/react/dist/ssr/BellRinging'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { DesktopTowerIcon } from '@phosphor-icons/react/dist/ssr/DesktopTower'
import { GameControllerIcon } from '@phosphor-icons/react/dist/ssr/GameController'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { ShieldSlashIcon } from '@phosphor-icons/react/dist/ssr/ShieldSlash'
import { ShieldWarningIcon } from '@phosphor-icons/react/dist/ssr/ShieldWarning'
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree'
import type { PageScreenProps } from '@/@types/screen'
import { Answer } from '@/components/answer'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { CharacterKeys } from '@/components/character-keys'
import { FeatureCard } from '@/components/feature-card'
import { PageLink } from '@/components/page-link'
import { Prose } from '@/components/prose'
import { Question } from '@/components/question'
import { SystemStage } from '@/components/system-stage'
import { TaskbarProof } from '@/components/taskbar-proof'
import { MENU_FEATURES } from '@/constants/pages'
import { QUESTIONS } from '@/constants/questions'
import { QUESTIONS_TITLE, PAGE_NAMES } from '@/constants/wording'
import { MOSAIC_SIZES } from '@/lib/media'

const FEATURES_TITLE = msg`Disponible sur Windows 10 et 11`

const TASKBAR_TITLE = msg`Votre barre des tâches devient votre team`

const TASKBAR_LEAD = msg`Vos clients Dofus Retro portent tous la même icône, et leur titre finit par « - Dofus Retro », qui coupe les pseudos longs. Multifus réécrit le titre et l’icône de chaque fenêtre, et vous décochez ce que vous ne voulez pas.`

const KEYS_TITLE = msg`Une touche, un personnage`

const KEYS_LEAD = msg`F1 sur votre premier Enutrof, F2 sur le second. Sur Windows, une touche de fonction se pose seule.`

export const WindowsScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <SystemStage page={page} system="windows" />
      <Band className="reveal gap-7 pt-4 pb-rest-xs">
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
        <ul className="mosaic">
          {MENU_FEATURES.map((feature) => {
            return (
              <li key={feature}>
                <FeatureCard page={feature} sizes={MOSAIC_SIZES} hasPeek />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal gap-7 py-rest-xs">
        <BandTitle>{i18n._(TASKBAR_TITLE)}</BandTitle>
        <Prose>{i18n._(TASKBAR_LEAD)}</Prose>
        <TaskbarProof />
      </Band>
      <Band className="reveal gap-7 py-rest-xs">
        <BandTitle>{i18n._(KEYS_TITLE)}</BandTitle>
        <Prose>{i18n._(KEYS_LEAD)}</Prose>
        <CharacterKeys />
      </Band>
      <Band className="reveal gap-7 pt-rest-xs pb-rest-lg">
        <BandTitle>{i18n._(QUESTIONS_TITLE)}</BandTitle>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          <li className="reveal">
            <Question ask={QUESTIONS.warning.ask} icon={ShieldWarningIcon}>
              <Answer lines={QUESTIONS.warning.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.blocked.ask} icon={ShieldSlashIcon}>
              <Answer lines={QUESTIONS.blocked.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.count.ask} icon={UsersThreeIcon}>
              <Answer lines={QUESTIONS.count.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.eleven.ask} icon={DesktopIcon}>
              <Answer lines={QUESTIONS.eleven.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.seven.ask} icon={DesktopTowerIcon}>
              <Answer lines={QUESTIONS.seven.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.windowsAccess.ask} icon={BellRingingIcon}>
              <Answer lines={QUESTIONS.windowsAccess.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.modern.ask} icon={GameControllerIcon}>
              <Answer lines={QUESTIONS.modern.answer} />
            </Question>
          </li>
          <li className="reveal">
            <Question ask={QUESTIONS.allowed.ask} icon={ShieldCheckIcon}>
              <Answer lines={QUESTIONS.allowed.answer} />
              <p>
                <PageLink page="ankama" className="rule border-b text-cream">
                  {i18n._(PAGE_NAMES.ankama)}
                </PageLink>
              </p>
            </Question>
          </li>
        </ul>
      </Band>
    </>
  )
}
