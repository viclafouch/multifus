import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { HOME_SHOT } from '@/constants/shots'

const SHOT_ALT = msg`La fenêtre de Multifus, avec le menu des fonctionnalités à gauche et la place des personnages connectés au centre.`

export const AppShot = () => {
  const { i18n } = useLingui()

  return (
    <img
      src={HOME_SHOT.src}
      alt={i18n._(SHOT_ALT)}
      width={HOME_SHOT.width}
      height={HOME_SHOT.height}
      className="stage h-auto w-full"
    />
  )
}
