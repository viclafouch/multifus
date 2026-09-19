import { msg } from '@lingui/core/macro'
import type { Ask, AskId } from '@/@types/ask'
import type { PageId } from '@/@types/page'
import { SYSTEM_VERSIONS } from '@/constants/systems'
import { NO_HARM, PAGE_PROMISES } from '@/constants/wording'

export const QUESTIONS = {
  free: {
    ask: msg`C’est gratuit ?`,
    answer: [
      msg`Oui, et pour toujours. Rien à payer, aucun compte à créer, aucune publicité. Il n’y a pas de version payante cachée derrière.`
    ]
  },
  risk: {
    ask: msg`Je risque quelque chose sur mon compte ?`,
    answer: [
      msg`Multifus ne touche pas au jeu. Il ne lit rien dedans, il ne change rien dedans, et il ne joue jamais à votre place. Ankama accepte ce genre de logiciel tant qu’il reste comme ça.`
    ]
  },
  safe: {
    ask: msg`Le fichier est sûr ?`,
    answer: [
      msg`Sur Mac, Apple vérifie le fichier avant qu’il s’ouvre, et aucun avertissement ne s’affiche. Sur Windows, votre ordinateur peut demander confirmation : Multifus est encore jeune, et Windows ne le connaît pas encore. Dans les deux cas, il ne vous demande aucune information, et n’en envoie aucune.`
    ]
  },
  machine: {
    ask: msg`Ça marche sur mon ordinateur ?`,
    answer: [
      msg`Sur Mac, il faut ${SYSTEM_VERSIONS.macos} ou plus récent, sur Mac Intel comme Apple Silicon.`,
      msg`Sur Windows, il faut ${SYSTEM_VERSIONS.windows} ou plus récent.`
    ]
  },
  macFloor: {
    ask: msg`Ça marche sur mon Mac ?`,
    answer: [
      msg`Il faut ${SYSTEM_VERSIONS.macos} ou plus récent. Les Mac Intel et les Mac Apple Silicon reçoivent le même fichier.`
    ]
  },
  monterey: {
    ask: msg`Mon Mac est sous Monterey, ça marche ?`,
    answer: [msg`Non. Il faut ${SYSTEM_VERSIONS.macos} ou plus récent.`]
  },
  macAccess: {
    ask: msg`Qu’est-ce que Multifus demande à macOS ?`,
    answer: [
      msg`L’accès à l’Accessibilité, et rien d’autre. C’est ce qui lui permet de voir et de ranger les fenêtres du jeu.`,
      msg`Sans cet accès, Multifus ne voit rien et ne peut rien faire.`,
      msg`Et son ouverture au démarrage du Mac, si vous cochez la case.`
    ]
  },
  count: {
    ask: msg`Je peux jouer combien de comptes ?`,
    answer: [
      msg`Autant que votre PC en ouvre. 4, 6, 8 clients Dofus Retro : Multifus les range tous pareil.`
    ]
  },
  eleven: {
    ask: msg`Ça marche sur Windows 11 ?`,
    answer: [msg`Oui, et sur Windows 10 aussi. L’installation prend 3 gestes.`]
  },
  seven: {
    ask: msg`Mon PC est sous Windows 7, ça marche ?`,
    answer: [msg`Non. Il faut Windows 10 ou Windows 11.`]
  },
  windowsAccess: {
    ask: msg`Qu’est-ce que Multifus demande à Windows ?`,
    answer: [
      msg`L’accès aux notifications, et rien d’autre.`,
      msg`Et son exécution au démarrage de Windows, si vous cochez la case.`
    ]
  },
  modern: {
    ask: msg`Ça marche sur Dofus 2 ou Dofus 3 ?`,
    answer: [msg`Non. Multifus ne connaît que Dofus Retro, la 1.29.`]
  },
  allowed: {
    ask: msg`Ankama l’autorise ?`,
    answer: [PAGE_PROMISES.ankama, NO_HARM]
  }
} as const satisfies Record<AskId, Ask>

export const PAGE_QUESTIONS = {
  home: null,
  autoFocus: null,
  wheel: null,
  walk: null,
  runeTable: null,
  relay: null,
  quickTexts: null,
  mac: ['macFloor', 'monterey', 'macAccess'],
  windows: ['count', 'eleven', 'seven', 'windowsAccess', 'modern', 'allowed'],
  comparison: null,
  download: ['free', 'risk', 'safe', 'machine'],
  journal: null,
  ankama: null,
  legal: null
} as const satisfies Record<PageId, readonly AskId[] | null>
