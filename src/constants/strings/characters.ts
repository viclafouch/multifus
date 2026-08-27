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
  male: 'Hommes dans le défilement et l’AutoFocus',
  female: 'Femmes dans le défilement et l’AutoFocus'
} as const satisfies Record<Gender, string>

const EMPTY_GROUP_LABELS = {
  male: 'Aucun homme connecté',
  female: 'Aucune femme connectée'
} as const satisfies Record<Gender, string>

const EXCLUDE_GROUP_LABELS = {
  male: 'Exclure tous les hommes',
  female: 'Exclure toutes les femmes'
} as const satisfies Record<Gender, string>

const INCLUDE_GROUP_LABELS = {
  male: 'Réintégrer tous les hommes',
  female: 'Réintégrer toutes les femmes'
} as const satisfies Record<Gender, string>

type EmptyStep = Readonly<{
  title: string
  line: string
}>

const EMPTY_STEPS = [
  {
    title: 'Lancez le jeu',
    line: 'Un client par personnage, comme d’habitude.'
  },
  {
    title: 'Entrez en jeu',
    line: 'Compte, serveur, puis votre personnage.'
  },
  {
    title: 'Il arrive ici',
    line: 'Sa ligne se pose seule, et elle y reste.'
  }
] as const satisfies readonly EmptyStep[]

export const CHARACTERS_STRINGS = {
  characters: {
    title: 'Personnages',
    subtitle:
      'Tirez une ligne par sa poignée pour changer l’ordre du défilement. Un raccourci vous ramène direct sur votre personnage principal.',
    online: 'Connecté',
    excluded: 'Exclu',
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
    includeToggle: (nickname: string) => {
      return `${nickname} dans le défilement et l’AutoFocus`
    },
    mainToggle: (nickname: string) => {
      return `${nickname} comme personnage principal`
    },
    mainSet: 'En faire votre personnage principal',
    mainUnset: 'Ne plus en faire votre personnage principal',
    remove: (nickname: string) => {
      return `Retirer ${nickname} du roster`
    },
    classes: CLASS_LABELS,
    genders: GENDER_LABELS,
    classMissing: 'Classe à choisir',
    genderMissing: 'Sexe à choisir',
    classPick: (nickname: string) => {
      return `Choisir la classe de ${nickname}`
    },
    genderPick: (nickname: string) => {
      return `Choisir le sexe de ${nickname}`
    },
    portraitChange: (nickname: string) => {
      return `Changer la classe ou le sexe de ${nickname}`
    },
    portraitChangeShort: 'Modifier',
    classDialogClose: 'Fermer sans rien changer',
    classDialogGender: 'Sexe',
    classDialogClasses: 'Classe',
    classDialogWhich: (label: string) => {
      return `${label} : homme ou femme ?`
    },
    classDialogBack: 'Changer de classe',
    classDialogWindowKeepsIcon:
      'Sur macOS, la tête reste ici : le client garde son logo Dofus.',
    classDialogPortraitOff:
      'La tête de classe est coupée dans les Paramètres : le client garde son logo Dofus.',
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
    exclusionTitle: 'Exclusion',
    exclusionDescription:
      'Un personnage exclu est sauté par les raccourcis et par le Déplacement rapide, et l’AutoFocus ne le fait plus passer devant. Ses messages privés continuent d’arriver.',
    groupLabel: GROUP_LABELS,
    excludeGroupLabel: EXCLUDE_GROUP_LABELS,
    includeGroupLabel: INCLUDE_GROUP_LABELS,
    emptyGroupLabel: EMPTY_GROUP_LABELS,
    missingGender: (names: string, alone: boolean) => {
      return alone
        ? `${names} n’a pas de sexe : il ne bougera pas.`
        : `${names} n’ont pas de sexe : ils ne bougeront pas.`
    },
    emptyTitle: 'Votre roster est vide',
    emptyBody:
      'Multifus ne connaît encore personne. Entrez en jeu, et votre premier personnage se pose ici tout seul.',
    emptySteps: EMPTY_STEPS,
    emptyHint:
      'Un client resté à l’écran de connexion n’a pas encore de pseudo.',
    emptyWatch: 'Multifus regarde vos fenêtres, une fois par seconde.'
  }
} as const
