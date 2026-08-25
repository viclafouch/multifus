import type { Gender } from '@/@types/roster'

const GROUP_LABELS = {
  male: 'Hommes',
  female: 'Femmes'
} as const satisfies Record<Gender, string>

const SLEEP_GROUP_LABELS = {
  male: 'Mettre tous les hommes de côté',
  female: 'Mettre toutes les femmes de côté'
} as const satisfies Record<Gender, string>

const WAKE_GROUP_LABELS = {
  male: 'Remettre tous les hommes dans le défilement',
  female: 'Remettre toutes les femmes dans le défilement'
} as const satisfies Record<Gender, string>

export const CHARACTERS_STRINGS = {
  characters: {
    title: 'Personnages',
    subtitle:
      'Vos personnages défilent au raccourci dans cet ordre. Tirez une ligne par sa poignée pour le changer.',
    online: 'Connecté',
    asleep: 'De côté',
    offline: 'Déconnecté',
    rankNone: '·',
    handle: (nickname: string) => {
      return `Déplacer ${nickname} dans le défilement`
    },
    drag: {
      instructions:
        'Pour prendre une ligne, appuyez sur la barre d’espace. Déplacez-la avec les flèches. Appuyez de nouveau sur la barre d’espace pour la poser, ou sur Échap pour annuler.',
      picked: (nickname: string) => {
        return `${nickname} est pris.`
      },
      movedTo: (nickname: string, rank: number) => {
        return `${nickname} passe en position ${rank}.`
      },
      dropped: (nickname: string, canceled: boolean) => {
        return canceled
          ? `Déplacement annulé. ${nickname} reste à sa place.`
          : `${nickname} est posé.`
      }
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
    sleepGroup: 'De côté',
    wakeGroup: 'Remettre',
    sleepGroupLabel: SLEEP_GROUP_LABELS,
    wakeGroupLabel: WAKE_GROUP_LABELS,
    noGenderYet:
      'Marquez vos personnages homme ou femme pour mettre tous vos hommes, ou toutes vos femmes, de côté d’un seul clic.',
    emptyTitle: 'Votre roster est vide',
    emptyBody:
      'Connectez un personnage dans Dofus Retro. Il arrive ici tout seul, et il y reste même une fois le client fermé.',
    emptyHint:
      'Un client resté sur l’écran de connexion n’a pas encore de pseudo. Multifus ne peut pas le reconnaître.',
    refresh: 'Chercher maintenant'
  }
} as const
