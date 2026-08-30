import type { RuneFamilyName } from '@/constants/runes'
import { TRY_IT } from '@/constants/strings/wheel'

const FAMILY_LABELS = {
  heavy: 'Les lourdes',
  damage: 'Dommages',
  resistance: 'Résistances',
  secondary: 'Secondaires',
  primary: 'Les légères'
} as const satisfies Record<RuneFamilyName, string>

export const RUNE_TABLE_TITLE = 'Tableau des runes'

const SHEET_STRINGS = {
  title: RUNE_TABLE_TITLE,
  stat: 'Stat',
  simple: 'Simple',
  pa: 'Pa',
  ra: 'Ra',
  unit: 'Point',
  empty: '—',
  emptyLabel: 'La rune n’existe pas',
  caption:
    'Le poids de chaque rune : la simple, la Pa, la Ra, et le poids d’un point de stat',
  close: 'Fermer le tableau des runes',
  families: FAMILY_LABELS
} as const

export const RUNE_TABLE_STRINGS = {
  runeTable: {
    title: RUNE_TABLE_TITLE,
    subtitle:
      'Les poids des runes, affichés par-dessus le jeu. Plus besoin d’aller les chercher ailleurs pendant que vous cassez.',
    shortcutLabel: 'Raccourci',
    shortcutDescription: 'Depuis une fenêtre du jeu, et nulle part ailleurs.',
    unbound:
      'Sans touches, le tableau ne s’affiche plus. Posez-en dans l’écran Raccourcis.',
    previewTitle: 'L’aperçu',
    previewDescription:
      'Le vrai tableau, posé au milieu de Multifus. Une jauge pour la taille, une pour ce qu’on voit du jeu derrière.',
    sizeLabel: 'Taille',
    sizeValue: (width: number) => {
      return `${width} px`
    },
    veilLabel: 'Transparence',
    veilValue: (transparency: number) => {
      return `${transparency} %`
    },
    whereTitle: 'Où il se montre',
    whereDescription:
      'Le tableau ne s’affiche que sur le personnage où vous l’avez ouvert.',
    everywhereLabel: 'Afficher sur tous les personnages connectés',
    everywhereNote: 'En général, un seul personnage forge.',
    recallLabel: 'Remettre à sa position initiale',
    recallNote:
      'Si vous l’avez poussé hors de l’écran, il revient en haut à droite du client.',
    recall: 'Remettre',
    tryIt: TRY_IT,
    fullScreenNote:
      'Le tableau ne s’affiche pas sur un client en plein écran. Forgez dans une fenêtre agrandie.',
    sheet: SHEET_STRINGS
  }
} as const
