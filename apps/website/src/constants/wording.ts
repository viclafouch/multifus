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
  quickTexts: msg`Textes rapides`,
  mac: msg`Multifus sur Mac`,
  windows: msg`Multifus sur Windows`,
  comparison: msg`Comparatif`,
  download: msg`Télécharger`,
  faq: msg`Questions fréquentes`,
  journal: msg`Journal des versions`,
  ankama: msg`Ankama tolère-t-il Multifus ?`,
  legal: msg`Mentions légales`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_TITLES = {
  home: msg`Logiciel multicompte gratuit pour Dofus Retro`,
  autoFocus: msg`AutoFocus en multicompte pour Dofus Retro`,
  wheel: msg`Changer de fenêtre en multicompte Dofus Retro`,
  walk: msg`Déplacer sa team en multicompte sur Dofus Retro`,
  runeTable: msg`Tableau du poids des runes Dofus Retro`,
  relay: msg`Messages privés Dofus Retro sur Telegram`,
  quickTexts: msg`Textes rapides au clavier sur Dofus Retro`,
  mac: msg`Logiciel multicompte Dofus Retro sur Mac`,
  windows: msg`Logiciel multicompte Dofus Retro sur Windows`,
  comparison: msg`Comparatif des logiciels multicompte Dofus Retro`,
  download: msg`Télécharger le logiciel multicompte Dofus Retro`,
  faq: msg`Le multicompte Dofus Retro en questions`,
  journal: msg`Journal des versions du multicompte Dofus Retro`,
  ankama: msg`Le multicompte est-il autorisé sur Dofus Retro ?`,
  legal: msg`Mentions légales`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_DESCRIPTIONS = {
  home: msg`Multifus amène devant vous la fenêtre du personnage qui joue sur Dofus Retro. Gratuit, sur Mac et sur Windows, sans compte et sans publicité.`,
  autoFocus: msg`L’AutoFocus amène devant vous la fenêtre du personnage qui joue sur Dofus Retro : début de tour, invitation, échange, message privé, craft, percepteur.`,
  wheel: msg`Changez de fenêtre sur Dofus Retro sans touche à retenir : maintenez une combinaison, visez une tête de classe dans la roue, lâchez, la fenêtre arrive.`,
  walk: msg`Un clic par personnage et votre team suit sur Dofus Retro : vous cliquez là où vous allez, la fenêtre du personnage suivant arrive devant vous.`,
  runeTable: msg`Le tableau du poids des runes de Dofus Retro se pose par-dessus le jeu, à la touche de votre choix. Vous forgemagez sans jamais ouvrir votre navigateur.`,
  relay: msg`Vos messages privés de Dofus Retro arrivent sur votre téléphone par Telegram, dans la seconde. Vous savez aussi quel personnage vient d’être déconnecté.`,
  quickTexts: msg`Rangez vos phrases les plus répétées sous une combinaison de touches. Dans Dofus Retro, vous appuyez, la phrase s’écrit, et c’est vous qui l’envoyez.`,
  mac: msg`Le multicompte Dofus Retro sur Mac, dans une application vérifiée par Apple qui s’ouvre au premier double-clic. Les six fonctionnalités y sont, sans exception.`,
  windows: msg`Le multicompte Dofus Retro sur Windows 10 et 11 : chaque personnage prend son bouton dans la barre des tâches, avec son pseudo et sa tête de classe.`,
  comparison: msg`Multifus, Dracoon, Focus Retro, Dosoft, Retro Toolbox, ROrganizer : quatorze lignes comparées, chacune lue dans le code de l’outil et pas sur sa page d’accueil.`,
  download: msg`Téléchargez Multifus gratuitement, pour Mac et pour Windows. Trois gestes pour installer, aucun compte à créer, aucune publicité, et le code est public.`,
  faq: msg`Ankama, votre compte, votre ordinateur, votre langue, le prix : les questions qu’on me pose avant d’installer un logiciel multicompte sur Dofus Retro.`,
  journal: msg`Ce que chaque version de Multifus a changé pour le multicompte sur Dofus Retro : les fonctionnalités ajoutées, les réglages déplacés, les défauts corrigés.`,
  ankama: msg`Oui. Ankama tolère les logiciels qui rangent les fenêtres du jeu tant qu’ils n’y touchent à rien. Les deux réponses publiques d’Ankama sont citées ici.`,
  legal: msg`Qui publie Multifus, qui héberge le site, ce qu’il garde de vous, et les marques citées ici qui ne sont pas les nôtres.`
} as const satisfies Record<PageId, MessageDescriptor>

export const PAGE_PROMISES = {
  home: msg`Jouez en multicompte sur Dofus Retro sans jamais chercher une fenêtre.`,
  autoFocus: msg`La fenêtre du personnage qui joue passe devant.`,
  wheel: msg`Le choix de vos personnages au premier plan.`,
  walk: msg`Un clic par personnage, et la team suit.`,
  runeTable: msg`Le poids des runes sans quitter le jeu.`,
  relay: msg`Votre téléphone reçoit vos messages privés du jeu.`,
  quickTexts: msg`Une combinaison écrit la phrase à votre place.`,
  mac: msg`Le multicompte Dofus Retro sur Mac, dans une application qu’Apple a vérifiée.`,
  windows: msg`Le multicompte Dofus Retro sur Windows, un bouton par personnage.`,
  comparison: msg`Multifus et les autres gestionnaires, ligne par ligne.`,
  download: msg`Multifus est gratuit, pour Mac et pour Windows. Trois gestes, et vous jouez en multicompte sur Dofus Retro.`,
  faq: msg`Ce qu’on me demande avant d’installer Multifus.`,
  journal: msg`Ce que chaque version a changé.`,
  ankama: msg`Oui. Ankama tolère les logiciels qui rangent les fenêtres du jeu, tant qu’ils n’y touchent à rien. Multifus reste dans ce cadre.`,
  legal: msg`Qui publie ce site, qui l’héberge, et le peu qu’il garde de vous.`
} as const satisfies Record<PageId, MessageDescriptor>

export const MENU_HINTS = {
  autoFocus: msg`La fenêtre qui joue passe devant.`,
  wheel: msg`Le personnage visé passe devant.`,
  walk: msg`Un clic gauche, et la team suit.`,
  runeTable: msg`Le poids des runes posé sur le jeu.`,
  relay: msg`Votre téléphone les reçoit.`,
  quickTexts: msg`Une combinaison écrit la phrase.`
} as const satisfies Record<(typeof MENU_FEATURES)[number], MessageDescriptor>

export const SOFTWARE_CATEGORY = msg`Gestionnaire de fenêtres`

export const LOOP_PLAY = msg`Lire`

export const LOOP_HOLD = msg`Pause`

export const INDEPENDENCE = msg`Projet indépendant, sans lien avec Ankama.`

export const TONGUES_TITLE = msg`La langue du site`

export const FEATURES_TAB = msg`Fonctionnalités`

export const HELP_TAB = msg`Aide`

export const FEATURES_TITLE = msg`Les fonctionnalités`

export const SOFTWARE_TITLE = msg`Le logiciel`

export const PROJECT_TITLE = msg`Le projet`

export const ELSEWHERE_TITLE = msg`Multifus ailleurs`

export const REACH_TITLE = msg`Votre question n’est pas là ?`

export const REACH_LEAD = msg`Écrivez-moi, je réponds.`

export const LIMITS_TITLE = msg`Ce que Multifus ne fait pas`

export const QUESTIONS_TITLE = msg`Les questions qu’on se pose`

export const NO_HARM = msg`Multifus ne lit pas la mémoire du jeu, ne touche à aucun de ses fichiers, et ne joue à votre place sur aucun personnage.`

export const BEFORE_INSTALL = msg`Avant d’installer`

export const PERKS = [
  msg`Gratuit`,
  msg`Sans compte`,
  msg`Sans publicité`
] as const satisfies readonly MessageDescriptor[]
