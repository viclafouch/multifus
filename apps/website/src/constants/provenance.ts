import { msg } from '@lingui/core/macro'
import type { Provenance, ProvenanceId } from '@/@types/provenance'

export const PROVENANCE_IDS = [
  'decors',
  'portraits',
  'loops',
  'posters',
  'tolerance',
  'options'
] as const satisfies readonly ProvenanceId[]

export const PROVENANCES = {
  decors: {
    name: msg`Les décors des fenêtres`,
    origin: msg`Les pages de découverte et les articles de dofus-retro.com, recadrés. Multifus en pose un derrière ce qu’il y a à lire, assez sombre pour qu’un texte se lise par-dessus.`
  },
  portraits: {
    name: msg`Les portraits des douze classes`,
    origin: msg`Les visuels de classe publiés par Ankama, un par classe et par sexe. On les voit sur la roue des personnages, et le même en petit sur la fenêtre du jeu, pour reconnaître un personnage sans lire son pseudo.`
  },
  loops: {
    name: msg`Les boucles vidéo`,
    origin: msg`Des captures d’écran faites ici, muettes et sans montage, que le site et le logiciel montrent tous les deux. Filmer son écran ne rend pas le décor moins celui d’Ankama, et c’est pour ça qu’elles sont dans cette liste.`
  },
  posters: {
    name: msg`L’image posée sur une vidéo`,
    origin: msg`Une image tirée de la vidéo qu’elle couvre, prise sur la seconde où la fonctionnalité se voit. Elle reste affichée tant que la lecture n’a pas commencé, et sert de vignette dans les résultats de recherche.`
  },
  tolerance: {
    name: msg`Les deux messages d’Ankama`,
    origin: msg`Deux captures de ce qu’Ankama a écrit en public sur les gestionnaires de fenêtres, l’une sur le forum de Dofus Retro, l’autre sur son compte X. Le logiciel les montre en entier, datées, et rouvre la page d’origine d’un clic.`
  },
  options: {
    name: msg`La fenêtre Options du client`,
    origin: msg`Une capture de l’écran des options du client, que Multifus montre une fois, à l’installation, pour dire où cocher. Elle ne sert nulle part ailleurs.`
  }
} as const satisfies Record<ProvenanceId, Provenance>
