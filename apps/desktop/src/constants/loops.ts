import { msg } from '@lingui/core/macro'
import autoFocusLoop from '@multifus/ankama/loops/auto-focus-loop.mp4'
import quickRepliesLoop from '@multifus/ankama/loops/quick-replies-loop.mp4'
import relayLoop from '@multifus/ankama/loops/relay-loop.mp4'
import runeTableLoop from '@multifus/ankama/loops/rune-table-loop.mp4'
import walkLoop from '@multifus/ankama/loops/walk-loop.mp4'
import wheelLoop from '@multifus/ankama/loops/wheel-loop.mp4'
import type { Loop } from '@/@types/loop'
import type { ScreenName } from '@/@types/snapshot'
import { MAP_NAMES } from '@/constants/world'

export const MAP_LOOPS = {
  about: null,
  autoFocus: {
    name: 'autoFocus',
    source: autoFocusLoop,
    title: MAP_NAMES.autoFocus,
    description: msg`Combat, échange ou défi : la fenêtre du personnage passe devant.`,
    caption: msg`Un défi arrive sur un autre personnage : sa fenêtre passe devant toute seule, la demande déjà à l’écran.`
  },
  characters: {
    name: 'wheel',
    source: wheelLoop,
    title: msg`La roue des personnages`,
    description: msg`Maintenez vos touches, visez une tête, lâchez : sa fenêtre passe devant.`,
    caption: msg`Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.`
  },
  quickReplies: {
    name: 'quickReplies',
    source: quickRepliesLoop,
    title: MAP_NAMES.quickReplies,
    description: msg`Une combinaison de touches, et le texte part dans la fenêtre du personnage.`,
    caption: msg`Les touches frappées dans le jeu : le texte tout prêt s’écrit dans la fenêtre du personnage et part, sans quitter le combat.`
  },
  relay: {
    name: 'relay',
    source: relayLoop,
    title: MAP_NAMES.relay,
    description: msg`Un joueur écrit à un personnage : son message part sur le téléphone.`,
    caption: msg`Un message privé arrive sur un personnage pendant qu’on joue ailleurs : Multifus le pose sur le téléphone, dans Telegram, avec le nom de qui l’a écrit.`
  },
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
