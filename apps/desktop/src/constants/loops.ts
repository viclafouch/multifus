import { msg } from '@lingui/core/macro'
import type { Loop } from '@/@types/loop'
import type { ScreenName } from '@/@types/snapshot'
import autoFocusLoop from '@/assets/ankama/auto-focus-loop.mp4'
import runeTableLoop from '@/assets/ankama/rune-table-loop.mp4'
import walkLoop from '@/assets/ankama/walk-loop.mp4'
import wheelLoop from '@/assets/ankama/wheel-loop.mp4'
import { MAP_NAMES } from '@/constants/world'

export const MAP_LOOPS = {
  about: null,
  autoFocus: {
    name: 'autoFocus',
    source: autoFocusLoop,
    title: MAP_NAMES.autoFocus,
    description: msg`Combat, échange ou défi sur un personnage : sa fenêtre passe devant toute seule.`,
    caption: msg`Un défi arrive sur un autre personnage : sa fenêtre passe devant toute seule, la demande déjà à l’écran.`
  },
  characters: {
    name: 'wheel',
    source: wheelLoop,
    title: msg`La roue des personnages`,
    description: msg`Maintenez vos touches, visez une tête, lâchez : sa fenêtre passe devant.`,
    caption: msg`Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.`
  },
  quickReplies: null,
  relay: null,
  runeTable: {
    name: 'runeTable',
    source: runeTableLoop,
    title: MAP_NAMES.runeTable,
    description: msg`Vos touches ouvrent le tableau par-dessus le jeu, et les mêmes le referment.`,
    caption: msg`Les touches frappées pendant une casse : le tableau s’ouvre sur le jeu, les poids sous les yeux, et la souris ne quitte pas l’atelier.`
  },
  settings: null,
  shortcuts: null,
  walk: {
    name: 'walk',
    source: walkLoop,
    title: MAP_NAMES.walk,
    description: msg`Un clic dans le jeu : le personnage marche, le suivant passe devant.`,
    caption: msg`Un clic gauche dans le jeu : le personnage marche, la fenêtre du suivant passe devant, et la bannière se pose dans le coin.`
  }
} as const satisfies Record<ScreenName, Loop | null>
