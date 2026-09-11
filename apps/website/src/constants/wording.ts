import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { PageId } from '@/@types/page'

export const PAGE_NAMES = {
  home: msg`Multifus`,
  autoFocus: msg`AutoFocus`,
  wheel: msg`Roue des personnages`,
  walk: msg`Déplacement rapide`,
  runeTable: msg`Tableau des runes`,
  shortcuts: msg`Raccourcis`,
  relay: msg`Messages privés`,
  quickReplies: msg`Réponses rapides`,
  mac: msg`Multifus sur Mac`,
  comparison: msg`Comparatif`,
  runeWeights: msg`Poids des runes`,
  download: msg`Télécharger`,
  journal: msg`Journal des versions`,
  images: msg`Les images`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_PROMISES = {
  home: msg`Jouez en multicompte sur Dofus Retro sans jamais chercher une fenêtre.`,
  autoFocus: msg`La fenêtre du personnage qui joue passe devant toute seule.`,
  wheel: msg`Un disque de têtes sous le pouce, et la bonne fenêtre arrive.`,
  walk: msg`Un clic gauche, et toute la team marche au même endroit.`,
  runeTable: msg`Le poids des runes posé par-dessus le jeu, sans quitter l’atelier.`,
  shortcuts: msg`Une touche par personnage, et le tour du roster au clavier.`,
  relay: msg`Les messages privés vous suivent sur le téléphone.`,
  quickReplies: msg`Un texte tout prêt part sous une combinaison de touches.`,
  mac: msg`Multifus tourne sur Mac, signé et notarisé par Apple.`,
  comparison: msg`Multifus et les autres gestionnaires, ligne par ligne.`,
  runeWeights: msg`La table des poids de runes, lisible et gratuite.`,
  download: msg`Prenez Multifus pour macOS ou pour Windows.`,
  journal: msg`Ce que chaque version a changé.`,
  images: msg`D’où vient chaque image, et à quelle condition.`
} as const satisfies Record<PageId, MessageDescriptor>

export const SITE_TITLE = msg`Multifus, logiciel multicompte gratuit pour Dofus Retro`

export const INDEPENDENCE = msg`Projet indépendant, sans lien avec Ankama.`

export const LIMITS_TITLE = msg`Ce que Multifus ne fait pas`

export const NO_HARM = msg`Multifus ne lit pas la mémoire du jeu, ne touche à aucun de ses fichiers, ne joue à votre place sur aucun personnage et ne vous garde pas connecté quand vous ne faites rien. Il regarde qui vous appelle, et il vous emmène.`

export const ONE_AT_A_TIME = msg`Un geste ne vaut que pour le personnage qui est devant vous, jamais pour toute la team d’un coup. Les macros qui déplacent plusieurs personnages ensemble sont bannissables, et elles restent hors de ce projet.`

export const BEFORE_INSTALL = msg`Avant d’installer`
