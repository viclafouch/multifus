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
  ankama: msg`Ce qu’Ankama en dit`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_PROMISES = {
  home: msg`Jouez en multicompte sur Dofus Retro sans jamais chercher une fenêtre.`,
  autoFocus: msg`La fenêtre du personnage qui joue passe devant toute seule.`,
  wheel: msg`Un disque de têtes sous le pouce, et la bonne fenêtre arrive.`,
  walk: msg`Un clic gauche, et toute la team marche au même endroit.`,
  runeTable: msg`Le poids des runes posé par-dessus le jeu, sans quitter l’atelier.`,
  relay: msg`Les messages privés vous suivent sur le téléphone.`,
  quickReplies: msg`Un texte tout prêt part sous une combinaison de touches.`,
  mac: msg`Multifus tourne sur Mac, signé et notarisé par Apple.`,
  comparison: msg`Multifus et les autres gestionnaires, ligne par ligne.`,
  download: msg`Gratuit, code publié, paquet signé. Pour macOS et pour Windows.`,
  journal: msg`Ce que chaque version a changé.`,
  ankama: msg`Ankama tolère les gestionnaires de fenêtres. Voici ses deux messages.`
} as const satisfies Record<PageId, MessageDescriptor>

export const MENU_HINTS = {
  autoFocus: msg`La fenêtre qui joue passe devant.`,
  wheel: msg`Une roue de têtes sous le pouce.`,
  walk: msg`Un clic gauche, et la team suit.`,
  runeTable: msg`Le poids des runes posé sur le jeu.`,
  relay: msg`Ils vous suivent sur le téléphone.`,
  quickReplies: msg`Un texte prêt part au raccourci.`
} as const satisfies Record<(typeof MENU_FEATURES)[number], MessageDescriptor>

export const SITE_TITLE = msg`Multifus, logiciel multicompte gratuit pour Dofus Retro`

export const INDEPENDENCE = msg`Projet indépendant, sans lien avec Ankama.`

export const LIMITS_TITLE = msg`Ce que Multifus ne fait pas`

export const NO_HARM = msg`Multifus ne lit pas la mémoire du jeu, ne touche à aucun de ses fichiers, et ne joue à votre place sur aucun personnage.`

export const BEFORE_INSTALL = msg`Avant d’installer`

export const FREE_AND_SIGNED = msg`Gratuit, code publié, paquet signé et notarisé.`
