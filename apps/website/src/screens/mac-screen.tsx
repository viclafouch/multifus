import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { DesktopTowerIcon } from '@phosphor-icons/react/dist/ssr/DesktopTower'
import { KeyIcon } from '@phosphor-icons/react/dist/ssr/Key'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { PageBody } from '@/components/page-body'
import { PageKin } from '@/components/page-kin'
import { Question } from '@/components/question'
import { SystemStage } from '@/components/system-stage'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { MAC_SHOT, MAC_SHOT_ALT } from '@/constants/shots'
import { SYSTEM_VERSIONS } from '@/constants/systems'
import { QUESTIONS_TITLE } from '@/constants/wording'

const ASK_MAC = msg`Ça marche sur mon Mac ?`

const MAC_ANSWER = msg`Il faut ${SYSTEM_VERSIONS.macos} ou plus récent. Les Mac Intel et les Mac Apple Silicon reçoivent le même fichier.`

const ASK_MONTEREY = msg`Mon Mac est sous Monterey, ça marche ?`

const MONTEREY_ANSWER = msg`Non. Il faut ${SYSTEM_VERSIONS.macos} ou plus récent.`

const ASK_ACCESS = msg`Qu’est-ce que Multifus demande à macOS ?`

const ACCESS_ANSWER = msg`L’accès à l’Accessibilité, et rien d’autre. C’est ce qui lui permet de voir et de ranger les fenêtres du jeu.`

const ACCESS_WARN = msg`Sans cet accès, Multifus ne voit rien et ne peut rien faire.`

const ACCESS_START = msg`Et son ouverture au démarrage du Mac, si vous cochez la case.`

export const MacScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      <SystemStage page={page} shot={MAC_SHOT} alt={MAC_SHOT_ALT} />
      {body === null ? null : <PageBody body={body} />}
      <Band className="reveal gap-7 pt-10 pb-20">
        <BandTitle>{i18n._(QUESTIONS_TITLE)}</BandTitle>
        <ul className="grid items-start gap-4 md:grid-cols-2">
          <li className="reveal">
            <Question ask={ASK_MAC} icon={DesktopIcon}>
              <p>{i18n._(MAC_ANSWER)}</p>
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
            <Question ask={ASK_MONTEREY} icon={DesktopTowerIcon}>
              <p>{i18n._(MONTEREY_ANSWER)}</p>
            </Question>
          </li>
          <li className="reveal">
            <Question ask={ASK_ACCESS} icon={KeyIcon}>
              <p>{i18n._(ACCESS_ANSWER)}</p>
              <p>{i18n._(ACCESS_WARN)}</p>
              <p>{i18n._(ACCESS_START)}</p>
            </Question>
          </li>
        </ul>
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
