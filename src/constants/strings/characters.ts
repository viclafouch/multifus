import type { Gender } from '@/@types/roster'

const GROUP_LABELS = {
  male: 'Hommes',
  female: 'Femmes'
} as const satisfies Record<Gender, string>

const SLEEP_GROUP_LABELS = {
  male: 'Endormir tous les hommes',
  female: 'Endormir toutes les femmes'
} as const satisfies Record<Gender, string>

const WAKE_GROUP_LABELS = {
  male: 'Réveiller tous les hommes',
  female: 'Réveiller toutes les femmes'
} as const satisfies Record<Gender, string>

export const CHARACTERS_STRINGS = {
  characters: {
    title: 'Personnages',
    subtitle:
      'L’ordre de cette liste est l’ordre du défilement. Faites glisser une ligne pour le changer.',
    inCycle: 'Dans le défilement',
    asleep: 'En veille',
    offline: 'Hors ligne',
    rankNone: '·',
    handle: (nickname: string) => {
      return `Déplacer ${nickname} dans le défilement`
    },
    cycleToggle: (nickname: string) => {
      return `Défilement de ${nickname}`
    },
    genderLabel: (nickname: string, gender: Gender) => {
      return gender === 'male'
        ? `Marquer ${nickname} comme homme`
        : `Marquer ${nickname} comme femme`
    },
    remove: (nickname: string) => {
      return `Retirer ${nickname} du roster`
    },
    groupedActions: 'Actions groupées',
    groupLabel: GROUP_LABELS,
    sleepGroup: 'Endormir',
    wakeGroup: 'Réveiller',
    sleepGroupLabel: SLEEP_GROUP_LABELS,
    wakeGroupLabel: WAKE_GROUP_LABELS,
    noGenderYet:
      'Assignez un sexe à vos personnages pour activer les actions groupées.',
    emptyTitle: 'Le roster est vide',
    emptyBody:
      'Ouvrez un client Dofus. Le personnage apparaît ici dès que sa fenêtre porte son pseudo, et il y reste même une fois le client fermé.',
    emptyHint:
      'Un client resté sur l’écran de connexion n’a pas encore de pseudo : il ne peut donc pas être reconnu.',
    refresh: 'Chercher maintenant'
  }
} as const
