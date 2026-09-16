import { msg } from '@lingui/core/macro'
import homeShot from '@multifus/ankama/images/multifus-home.webp'
import macShot from '@multifus/ankama/images/multifus-mac.webp'
import windowsShot from '@multifus/ankama/images/multifus-windows.webp'
import taskbarSplitShot from '@multifus/ankama/images/windows-taskbar-split.webp'
import taskbarStackedShot from '@multifus/ankama/images/windows-taskbar-stacked.webp'
import type { Picture } from '@/@types/media'

export const HOME_SHOT = {
  src: homeShot,
  width: 1400,
  height: 995
} as const satisfies Picture

export const HOME_SHOT_ALT = msg`La fenêtre de Multifus, avec le menu des fonctionnalités à gauche et la place des personnages connectés au centre.`

export const MAC_SHOT = {
  src: macShot,
  width: 1920,
  height: 1080
} as const satisfies Picture

export const MAC_SHOT_ALT = msg`La fenêtre de Multifus sur Mac, par-dessus les clients Dofus Retro ouverts sur le bureau.`

export const WINDOWS_SHOT = {
  src: windowsShot,
  width: 1920,
  height: 1080
} as const satisfies Picture

export const WINDOWS_SHOT_ALT = msg`La fenêtre de Multifus sur Windows, par-dessus les clients Dofus Retro, et la barre des tâches avec un bouton par personnage.`

export const TASKBAR_STACKED_SHOT = {
  src: taskbarStackedShot,
  width: 1024,
  height: 104
} as const satisfies Picture

export const TASKBAR_SPLIT_SHOT = {
  src: taskbarSplitShot,
  width: 1024,
  height: 104
} as const satisfies Picture
