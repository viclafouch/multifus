import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { BellRingingIcon } from '@phosphor-icons/react/dist/ssr/BellRinging'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { DesktopTowerIcon } from '@phosphor-icons/react/dist/ssr/DesktopTower'
import { GameControllerIcon } from '@phosphor-icons/react/dist/ssr/GameController'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree'
import type { Point } from '@/@types/body'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { CaveatList } from '@/components/caveat-list'
import { CharacterKeys } from '@/components/character-keys'
import { FeatureCard } from '@/components/feature-card'
import { PageLink } from '@/components/page-link'
import { PointList } from '@/components/point-list'
import { Prose } from '@/components/prose'
import { Question } from '@/components/question'
import { SystemStage } from '@/components/system-stage'
import { TaskbarProof } from '@/components/taskbar-proof'
import { MENU_FEATURES } from '@/constants/pages'
import { WINDOWS_SHOT, WINDOWS_SHOT_ALT } from '@/constants/shots'
import {
  QUESTIONS_TITLE,
  NO_HARM,
  PAGE_NAMES,
  PAGE_PROMISES
} from '@/constants/wording'

const FEATURES_TITLE = msg`Disponible sur Windows 10 et 11`

const TASKBAR_TITLE = msg`Votre barre des tâches devient votre team`

const TASKBAR_LEAD = msg`Windows empile les fenêtres d’un même jeu sous un seul bouton. Avec 6 Enutrofs et 2 Crâs, vous cherchez. Multifus donne son bouton à chacun.`

const TASKBAR_POINTS = [
  {
    lead: msg`Seulement le pseudo.`,
    line: msg`Vous lisez « Elyandra », pas « Elyandra - Dofus Retro ».`
  },
  {
    lead: msg`La tête de classe.`,
    line: msg`Votre Enutrof porte sa tête d’Enu, votre Crâ la sienne.`
  },
  {
    lead: msg`La couleur du personnage.`,
    line: msg`Vos 6 Enutrofs ont la même tête. La couleur les sépare.`
  },
  {
    lead: msg`Un bouton par personnage.`,
    line: msg`Vos clients ne s’empilent plus : chacun garde sa place.`
  }
] as const satisfies readonly Point[]

const KEYS_TITLE = msg`Une touche, un personnage`

const KEYS_LEAD = msg`F1 sur votre premier Enutrof, F2 sur le second. Sur Windows, une touche de fonction se pose seule.`

const ASK_COUNT = msg`Je peux jouer combien de comptes ?`

const COUNT_ANSWER = msg`Autant que votre PC en ouvre. 4, 6, 8 clients Dofus Retro : Multifus les range tous pareil.`

const ASK_ELEVEN = msg`Ça marche sur Windows 11 ?`

const ELEVEN_ANSWER = msg`Oui, et sur Windows 10 aussi. L’installation prend 3 gestes.`

const ASK_SEVEN = msg`Mon PC est sous Windows 7, ça marche ?`

const SEVEN_ANSWER = msg`Non. Il faut Windows 10 ou Windows 11.`

const ASK_ACCESS = msg`Qu’est-ce que Multifus demande à Windows ?`

const ACCESS_ANSWER = msg`L’accès aux notifications, et rien d’autre.`

const ACCESS_START = msg`Et son exécution au démarrage de Windows, si vous cochez la case.`

const ASK_MODERN = msg`Ça marche sur Dofus 2 ou Dofus 3 ?`

const MODERN_ANSWER = msg`Non. Multifus ne connaît que Dofus Retro, la 1.29.`

const ASK_ALLOWED = msg`Ankama l’autorise ?`

const CAVEATS = [
  msg`Windows peut demander confirmation la première fois : il ne connaît pas encore Multifus.`,
  msg`Multifus fermé, le titre et l’icône d’origine reviennent.`
] as const satisfies readonly MessageDescriptor[]

export const WindowsScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <SystemStage page={page} shot={WINDOWS_SHOT} alt={WINDOWS_SHOT_ALT} />
      <Band className="reveal gap-7 pt-4 pb-10">
        <BandTitle>{i18n._(FEATURES_TITLE)}</BandTitle>
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
      <Band className="reveal gap-7 py-10">
        <BandTitle>{i18n._(TASKBAR_TITLE)}</BandTitle>
        <Prose>{i18n._(TASKBAR_LEAD)}</Prose>
        <TaskbarProof />
        <PointList isSplit points={TASKBAR_POINTS} />
      </Band>
      <Band className="reveal gap-7 py-10">
        <BandTitle>{i18n._(KEYS_TITLE)}</BandTitle>
        <Prose>{i18n._(KEYS_LEAD)}</Prose>
        <CharacterKeys />
      </Band>
      <Band className="reveal gap-7 py-10">
        <BandTitle>{i18n._(QUESTIONS_TITLE)}</BandTitle>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          <li className="reveal">
            <Question ask={ASK_COUNT} icon={UsersThreeIcon}>
              <p>{i18n._(COUNT_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_ELEVEN} icon={DesktopIcon}>
              <p>{i18n._(ELEVEN_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_SEVEN} icon={DesktopTowerIcon}>
              <p>{i18n._(SEVEN_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_ACCESS} icon={BellRingingIcon}>
              <p>{i18n._(ACCESS_ANSWER)}</p>
              <p>{i18n._(ACCESS_START)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_MODERN} icon={GameControllerIcon}>
              <p>{i18n._(MODERN_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_ALLOWED} icon={ShieldCheckIcon}>
              <p>{i18n._(PAGE_PROMISES.ankama)}</p>
              <p>{i18n._(NO_HARM)}</p>
              <p>
                <PageLink page="ankama" className="rule border-b text-cream">
                  {i18n._(PAGE_NAMES.ankama)}
                </PageLink>
              </p>
            </Question>
          </li>
        </ul>
      </Band>
      <Band className="reveal pt-8 pb-20">
        <CaveatList caveats={CAVEATS} />
      </Band>
    </>
  )
}
