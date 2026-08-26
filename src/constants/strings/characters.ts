import type { Class, Gender } from '@/@types/roster'

const CLASS_LABELS = {
  feca: 'Féca',
  osamodas: 'Osamodas',
  enutrof: 'Enutrof',
  sram: 'Sram',
  xelor: 'Xélor',
  ecaflip: 'Ecaflip',
  eniripsa: 'Eniripsa',
  iop: 'Iop',
  cra: 'Crâ',
  sadida: 'Sadida',
  sacrieur: 'Sacrieur',
  pandawa: 'Pandawa'
} as const satisfies Record<Class, string>

const GENDER_LABELS = {
  male: 'Homme',
  female: 'Femme'
} as const satisfies Record<Gender, string>

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
    remove: (nickname: string) => {
      return `Retirer ${nickname} du roster`
    },
    classes: CLASS_LABELS,
    genders: GENDER_LABELS,
    classDialog: (nickname: string) => {
      return `Classe et sexe de ${nickname}`
    },
    classDialogClose: 'Fermer sans rien changer',
    classDialogGender: 'Sexe',
    classDialogClasses: 'Classe',
    classDialogWhich: (label: string) => {
      return `${label} — homme ou femme ?`
    },
    classDialogBack: 'Changer de classe',
    classDialogWindowKeepsIcon:
      'Sur macOS, la tête reste ici : le client garde son logo Dofus.',
    classGenderLabel: (label: string, gender: Gender) => {
      return gender === 'male' ? `${label} homme` : `${label} femme`
    },
    noClass: 'Aucune',
    noClassLabel: (nickname: string) => {
      return `Retirer la classe de ${nickname}`
    },
    classLabel: (nickname: string, label: string) => {
      return `Marquer ${nickname} comme ${label}`
    },
    groupedActions: 'Actions groupées',
    groupLabel: GROUP_LABELS,
    sleepGroup: 'De côté',
    wakeGroup: 'Remettre',
    sleepGroupLabel: SLEEP_GROUP_LABELS,
    wakeGroupLabel: WAKE_GROUP_LABELS,
    missingGender: (names: string, alone: boolean) => {
      return alone ? `${names} n’a pas de sexe.` : `${names} n’ont pas de sexe.`
    },
    emptyTitle: 'Votre roster est vide',
    emptyBody:
      'Connectez un personnage dans Dofus Retro. Il arrive ici tout seul, et il y reste même une fois le client fermé.',
    emptyHint:
      'Un client resté sur l’écran de connexion n’a pas encore de pseudo. Multifus ne peut pas le reconnaître.',
    refresh: 'Chercher maintenant'
  }
} as const
