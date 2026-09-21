import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import macSmallEnglish from '@multifus/ankama/images/multifus-mac-760.en.webp'
import macSmallSpanish from '@multifus/ankama/images/multifus-mac-760.es.webp'
import macSmallFrench from '@multifus/ankama/images/multifus-mac-760.fr.webp'
import macFullEnglish from '@multifus/ankama/images/multifus-mac.en.webp'
import macFullSpanish from '@multifus/ankama/images/multifus-mac.es.webp'
import macFullFrench from '@multifus/ankama/images/multifus-mac.fr.webp'
import windowsSmallEnglish from '@multifus/ankama/images/multifus-windows-760.en.webp'
import windowsSmallSpanish from '@multifus/ankama/images/multifus-windows-760.es.webp'
import windowsSmallFrench from '@multifus/ankama/images/multifus-windows-760.fr.webp'
import windowsFullEnglish from '@multifus/ankama/images/multifus-windows.en.webp'
import windowsFullSpanish from '@multifus/ankama/images/multifus-windows.es.webp'
import windowsFullFrench from '@multifus/ankama/images/multifus-windows.fr.webp'
import taskbarSplitShot from '@multifus/ankama/images/windows-taskbar-split.webp'
import taskbarStackedShot from '@multifus/ankama/images/windows-taskbar-stacked.webp'
import type { Language } from '@/@types/language'
import type { Picture, Shot, Size } from '@/@types/media'
import type { SystemId } from '@/@types/system'

const MAC_FULL_SIZE = {
  width: 1400,
  height: 996
} as const satisfies Size

const MAC_SMALL_SIZE = {
  width: 760,
  height: 541
} as const satisfies Size

const WINDOWS_FULL_SIZE = {
  width: 975,
  height: 788
} as const satisfies Size

const WINDOWS_SMALL_SIZE = {
  width: 760,
  height: 614
} as const satisfies Size

export const SYSTEM_SHOTS = {
  macos: {
    fr: {
      full: { ...MAC_FULL_SIZE, src: macFullFrench },
      small: { ...MAC_SMALL_SIZE, src: macSmallFrench }
    },
    en: {
      full: { ...MAC_FULL_SIZE, src: macFullEnglish },
      small: { ...MAC_SMALL_SIZE, src: macSmallEnglish }
    },
    es: {
      full: { ...MAC_FULL_SIZE, src: macFullSpanish },
      small: { ...MAC_SMALL_SIZE, src: macSmallSpanish }
    }
  },
  windows: {
    fr: {
      full: { ...WINDOWS_FULL_SIZE, src: windowsFullFrench },
      small: { ...WINDOWS_SMALL_SIZE, src: windowsSmallFrench }
    },
    en: {
      full: { ...WINDOWS_FULL_SIZE, src: windowsFullEnglish },
      small: { ...WINDOWS_SMALL_SIZE, src: windowsSmallEnglish }
    },
    es: {
      full: { ...WINDOWS_FULL_SIZE, src: windowsFullSpanish },
      small: { ...WINDOWS_SMALL_SIZE, src: windowsSmallSpanish }
    }
  }
} as const satisfies Record<SystemId, Record<Language, Shot>>

export const SYSTEM_SHOT_ALTS = {
  macos: msg`La fenêtre de Multifus sur Mac, avec le menu des fonctionnalités à gauche et quatre personnages connectés au centre.`,
  windows: msg`La fenêtre de Multifus sur Windows, avec le menu des fonctionnalités à gauche et quatre personnages connectés au centre.`
} as const satisfies Record<SystemId, MessageDescriptor>

export const TASKBAR_STACKED_SHOT = {
  src: taskbarStackedShot,
  width: 640,
  height: 39
} as const satisfies Picture

export const TASKBAR_SPLIT_SHOT = {
  src: taskbarSplitShot,
  width: 640,
  height: 39
} as const satisfies Picture
