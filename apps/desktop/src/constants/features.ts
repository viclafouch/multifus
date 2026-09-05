import { msg } from '@lingui/core/macro'
import type { ScreenName } from '@/@types/snapshot'
import type { Phrase } from '@/lib/i18n'

type Feature = {
  readonly name: Phrase
  readonly line: Phrase
  readonly screen: ScreenName | null
}

export const FEATURES = [
  {
    name: msg`L’AutoFocus`,
    line: msg`Le jeu vous appelle, sa fenêtre passe devant.`,
    screen: 'autoFocus'
  },
  {
    name: msg`La roue des personnages`,
    line: msg`Maintenez la combinaison, visez une tête, lâchez.`,
    screen: 'wheel'
  },
  {
    name: msg`Le Déplacement rapide`,
    line: msg`Un clic gauche, et toute la team change de map.`,
    screen: 'walk'
  },
  {
    name: msg`Le tableau des runes`,
    line: msg`Le poids des runes, posé sur la fenêtre du jeu.`,
    screen: 'runeTable'
  },
  {
    name: msg`Les réponses rapides`,
    line: msg`Un texte tout prêt, collé dans le chat.`,
    screen: 'quickReplies'
  },
  {
    name: msg`Les messages privés`,
    line: msg`Vos MP suivis sur votre téléphone, par Telegram.`,
    screen: 'relay'
  },
  {
    name: msg`Les raccourcis`,
    line: msg`F1 sur l’Eniripsa, F2 sur le Sacrieur.`,
    screen: 'shortcuts'
  },
  {
    name: msg`Vos personnages`,
    line: msg`Sa classe, son sexe, sa couleur, sa tête sur sa fenêtre.`,
    screen: 'characters'
  },
  {
    name: msg`Les fenêtres agrandies`,
    line: msg`Un client qui s’ouvre prend tout son écran.`,
    screen: null
  }
] as const satisfies readonly Feature[]
