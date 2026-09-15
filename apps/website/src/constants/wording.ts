import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { PageId } from '@/@types/page'
import type { MENU_FEATURES } from '@/constants/pages'

export const PAGE_NAMES = {
  home: msg`Multifus`,
  autoFocus: msg`AutoFocus`,
  wheel: msg`Roue des personnages`,
  walk: msg`Déplacement rapide`,
  runeTable: msg`Tableau des runes`,
  relay: msg`Messages privés`,
  quickReplies: msg`Réponses rapides`,
  mac: msg`Multifus sur Mac`,
  comparison: msg`Comparatif`,
  download: msg`Télécharger`,
  journal: msg`Journal des versions`,
  ankama: msg`Ce qu’Ankama en dit`,
  legal: msg`Mentions légales`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_TITLES = {
  home: msg`Multifus, logiciel multicompte gratuit pour Dofus Retro`,
  autoFocus: msg`AutoFocus multicompte pour Dofus Retro`,
  wheel: msg`Roue des personnages pour le multicompte Dofus Retro`,
  walk: msg`Déplacement rapide multicompte sur Dofus Retro`,
  runeTable: msg`Tableau du poids des runes de Dofus Retro`,
  relay: msg`Messages privés de Dofus Retro sur Telegram`,
  quickReplies: msg`Réponses rapides au clavier sur Dofus Retro`,
  mac: msg`Logiciel multicompte Dofus Retro sur Mac`,
  comparison: msg`Comparatif des logiciels multicompte Dofus Retro`,
  download: msg`Télécharger le multicompte Dofus Retro gratuit`,
  journal: msg`Journal des versions de Multifus`,
  ankama: msg`Ankama et les logiciels multicompte Dofus Retro`,
  legal: msg`Mentions légales`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_PROMISES = {
  home: msg`Jouez en multicompte sur Dofus Retro sans jamais chercher une fenêtre.`,
  autoFocus: msg`La fenêtre du personnage qui joue passe devant toute seule.`,
  wheel: msg`Un disque de têtes sous le pouce, et la bonne fenêtre arrive.`,
  walk: msg`Un clic par personnage, et toute la team marche au même endroit.`,
  runeTable: msg`Le poids des runes posé par-dessus le jeu, sans quitter l’atelier.`,
  relay: msg`Les messages privés vous suivent sur le téléphone.`,
  quickReplies: msg`Un texte tout prêt part sous une combinaison de touches.`,
  mac: msg`Multifus tourne sur Mac, signé et notarisé par Apple.`,
  comparison: msg`Multifus et les autres gestionnaires, ligne par ligne.`,
  download: msg`Multifus est gratuit, pour Mac et pour Windows. Trois gestes, et vous jouez en multicompte sur Dofus Retro.`,
  journal: msg`Ce que chaque version a changé.`,
  ankama: msg`Ankama tolère les gestionnaires de fenêtres. Voici ses deux messages.`,
  legal: msg`Qui publie ce site, qui l’héberge, et le peu qu’il garde de vous.`
} as const satisfies Record<PageId, MessageDescriptor>

export const MENU_HINTS = {
  autoFocus: msg`La fenêtre qui joue passe devant.`,
  wheel: msg`Une roue de têtes sous le pouce.`,
  walk: msg`Un clic gauche, et la team suit.`,
  runeTable: msg`Le poids des runes posé sur le jeu.`,
  relay: msg`Ils vous suivent sur le téléphone.`,
  quickReplies: msg`Un texte prêt part au raccourci.`
} as const satisfies Record<(typeof MENU_FEATURES)[number], MessageDescriptor>

export const LOOP_PLAY = msg`Lire`

export const LOOP_HOLD = msg`Pause`

export const INDEPENDENCE = msg`Projet indépendant, sans lien avec Ankama.`

export const LIMITS_TITLE = msg`Ce que Multifus ne fait pas`

export const CAVEATS_TITLE = msg`À savoir`

export const NO_HARM = msg`Multifus ne lit pas la mémoire du jeu, ne touche à aucun de ses fichiers, et ne joue à votre place sur aucun personnage.`

export const BEFORE_INSTALL = msg`Avant d’installer`

export const PERKS = [
  msg`Gratuit`,
  msg`Sans compte`,
  msg`Sans publicité`
] as const satisfies readonly MessageDescriptor[]
