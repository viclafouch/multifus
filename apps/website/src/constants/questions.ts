import { msg } from '@lingui/core/macro'
import type { Ask, AskId } from '@/@types/ask'
import type { PageId } from '@/@types/page'
import {
  ANKAMA_FORUM,
  ANKAMA_POST,
  GAME,
  RELEASES,
  REPOSITORY
} from '@/constants/site'
import { SYSTEM_VERSIONS } from '@/constants/systems'
import { NO_HARM, PAGE_PROMISES } from '@/constants/wording'

export const QUESTIONS = {
  inside: {
    ask: msg`Comment ça marche ?`,
    answer: [
      {
        said: msg`Multifus écoute les <0>notifications</0> que Dofus Retro envoie à votre ordinateur : début de tour, invitation, échange, message privé, craft, percepteur attaqué. Windows lui en donne l’accès, macOS passe par l’Accessibilité.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Il lit le <0>titre de vos fenêtres</0> Dofus Retro, où le jeu écrit le pseudo du personnage. La <1>Roue des personnages</1> et le <2>Déplacement rapide</2> voient votre clic, et les <3>Textes rapides</3> collent la phrase dans la fenêtre devant vous.`,
        marks: [
          { kind: 'stress' },
          { kind: 'page', page: 'wheel' },
          { kind: 'page', page: 'walk' },
          { kind: 'page', page: 'quickTexts' }
        ]
      },
      {
        said: msg`Il n’ouvre aucun fichier de Dofus Retro, et ne lit pas sa mémoire. Le <0>code est public</0>, vous pouvez le lire.`,
        marks: [{ kind: 'out', href: REPOSITORY }]
      }
    ]
  },
  parity: {
    ask: msg`Tout est pareil sur Mac et sur Windows ?`,
    answer: [
      {
        said: msg`Les six mécanismes sont sur les deux. <0>Trois choses manquent au Mac.</0>`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`La barre des tâches de Windows donne un bouton par personnage, avec son pseudo seul dessus et sa tête de classe. Le Mac n’a pas cette barre, donc pas ces boutons.`
      },
      {
        said: msg`Sur Windows, la touche <0>F1 seule</0> appelle un personnage. Sur Mac, il faut une combinaison, Ctrl+Maj+1 par exemple.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Sur Windows, Multifus efface la notification une fois qu’il vous a amené sur le personnage. Sur Mac, la bannière reste jusqu’à ce qu’elle parte d’elle-même.`
      },
      {
        said: msg`Le détail par système est sur <0>Multifus sur Mac</0> et <1>Multifus sur Windows</1>.`,
        marks: [
          { kind: 'page', page: 'mac' },
          { kind: 'page', page: 'windows' }
        ]
      }
    ]
  },
  tongue: {
    ask: msg`Multifus parle ma langue ?`,
    answer: [
      {
        said: msg`<0>Français, anglais, espagnol.</0> Il prend celle de votre ordinateur, et vous en changez dans les réglages.`,
        marks: [{ kind: 'stress' }]
      }
    ]
  },
  money: {
    ask: msg`C’est gratuit, alors qui paie ?`,
    answer: [
      {
        said: msg`<0>Moi.</0> Pas de publicité, pas de compte, pas de version payante. Je paie l’hébergement et le certificat d’Apple.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Je ne vends rien et je ne demande rien. Si le projet vous plaît, une étoile sur <0>GitHub</0> suffit.`,
        marks: [{ kind: 'out', href: REPOSITORY }]
      }
    ]
  },
  free: {
    ask: msg`C’est gratuit ?`,
    answer: [
      {
        said: msg`Oui, et pour toujours. Rien à payer, aucun compte à créer, aucune publicité. Il n’y a pas de version payante cachée derrière.`
      }
    ]
  },
  risk: {
    ask: msg`Je risque quelque chose sur mon compte ?`,
    answer: [
      {
        said: msg`Multifus ne touche pas à Dofus Retro. Il ne lit rien dedans, il ne change rien dedans, et il ne joue <0>jamais</0> à votre place.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Ankama tolère ce genre de logiciel tant qu’il reste comme ça. Elle l’a dit dans un <0>message de Dofus Retro</0> et dans un <1>sujet du forum officiel</1>, tous deux repris sur <2>Ankama et Multifus</2>.`,
        marks: [
          { kind: 'out', href: ANKAMA_POST },
          { kind: 'out', href: ANKAMA_FORUM },
          { kind: 'page', page: 'ankama' }
        ]
      }
    ]
  },
  safe: {
    ask: msg`Le fichier est sûr ?`,
    answer: [
      {
        said: msg`Sur Mac, Apple a vérifié le fichier : au premier lancement, macOS demande seulement de confirmer, et précise qu’aucun logiciel malveillant n’a été trouvé. Sur Windows, votre ordinateur peut demander confirmation : Multifus est encore jeune, et Windows ne le connaît pas encore.`
      },
      {
        said: msg`Dans les deux cas, il ne crée aucun compte et <0>n’envoie rien qui vous nomme</0> : ni pseudo, ni message, ni fichier du jeu. Il partage des statistiques d’usage, qu’une case des Réglages coupe, et les <1>Mentions légales</1> en donnent le détail. Telegram ne reçoit vos messages que si vous branchez vous-même les <2>Messages privés</2>.`,
        marks: [
          { kind: 'stress' },
          { kind: 'page', page: 'legal' },
          { kind: 'page', page: 'relay' }
        ]
      }
    ]
  },
  machine: {
    ask: msg`Ça marche sur mon ordinateur ?`,
    answer: [
      {
        said: msg`Sur Mac, il faut ${SYSTEM_VERSIONS.macos} ou plus récent, sur Mac Intel comme Apple Silicon.`
      },
      {
        said: msg`Sur Windows, il faut ${SYSTEM_VERSIONS.windows} ou plus récent.`
      }
    ]
  },
  macFloor: {
    ask: msg`Ça marche sur mon Mac ?`,
    answer: [
      {
        said: msg`Il faut <0>${SYSTEM_VERSIONS.macos} ou plus récent</0>. Les Mac Intel et les Mac Apple Silicon reçoivent le même fichier.`,
        marks: [{ kind: 'stress' }]
      }
    ]
  },
  monterey: {
    ask: msg`Mon Mac est sous Monterey, ça marche ?`,
    answer: [
      { said: msg`Non. Il faut ${SYSTEM_VERSIONS.macos} ou plus récent.` }
    ]
  },
  macAccess: {
    ask: msg`Qu’est-ce que Multifus demande à macOS ?`,
    answer: [
      {
        said: msg`<0>L’accès à l’Accessibilité, et rien d’autre.</0> C’est ce qui lui permet de voir et de ranger les fenêtres du jeu.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Sans cet accès, Multifus ne voit rien et ne peut rien faire.`
      },
      {
        said: msg`Et son ouverture au démarrage du Mac, si vous cochez la case.`
      }
    ]
  },
  macFullScreen: {
    ask: msg`Le plein écran du Mac, ça marche ?`,
    answer: [
      {
        said: msg`<0>Non.</0> Le plein écran du Mac donne au client un bureau à lui seul, et macOS n’y laisse rien s’afficher par-dessus.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Tant que le client reste en plein écran, la <0>Roue des personnages</0>, le <1>Tableau des runes</1> et la bannière du <2>Déplacement rapide</2> ne s’affichent pas.`,
        marks: [
          { kind: 'page', page: 'wheel' },
          { kind: 'page', page: 'runeTable' },
          { kind: 'page', page: 'walk' }
        ]
      },
      {
        said: msg`Quittez le plein écran. En fenêtre agrandie, tout revient.`
      }
    ]
  },
  count: {
    ask: msg`Je peux jouer combien de comptes ?`,
    answer: [
      {
        said: msg`<0>Autant que votre PC en ouvre.</0> 4, 6, 8 clients Dofus Retro : Multifus les range tous pareil.`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Ankama ne met aucune limite au nombre de clients ouverts, et Multifus non plus. Le <0>comparatif</0> dit ce que font les autres.`,
        marks: [{ kind: 'page', page: 'comparison' }]
      }
    ]
  },
  eleven: {
    ask: msg`Ça marche sur Windows 11 ?`,
    answer: [
      {
        said: msg`<0>Oui, et sur Windows 10 aussi.</0> L’installation prend 3 gestes.`,
        marks: [{ kind: 'stress' }]
      }
    ]
  },
  seven: {
    ask: msg`Mon PC est sous Windows 7, ça marche ?`,
    answer: [{ said: msg`Non. Il faut Windows 10 ou Windows 11.` }]
  },
  warning: {
    ask: msg`Windows affiche un avertissement, c’est normal ?`,
    answer: [
      {
        said: msg`<0>Oui. Cliquez sur « Informations complémentaires », puis sur « Exécuter quand même ».</0>`,
        marks: [{ kind: 'stress' }]
      },
      {
        said: msg`Windows prévient pour tout logiciel qu’il voit encore peu, et Multifus vient de sortir. L’avertissement partira quand assez de monde l’aura téléchargé.`
      },
      {
        said: msg`Payer un certificat ne le ferait pas partir plus vite. Chaque version porte une <0>attestation GitHub</0> qui dit de quel code elle a été construite.`,
        marks: [{ kind: 'out', href: RELEASES }]
      }
    ]
  },
  windowsAccess: {
    ask: msg`Qu’est-ce que Multifus demande à Windows ?`,
    answer: [
      { said: msg`L’accès aux notifications, et rien d’autre.` },
      {
        said: msg`Et son exécution au démarrage de Windows, si vous cochez la case.`
      }
    ]
  },
  modern: {
    ask: msg`Ça marche sur Dofus 2 ou Dofus 3 ?`,
    answer: [
      {
        said: msg`Non. Multifus ne connaît que <0>Dofus Retro</0>, toutes versions 1.x : la 1.29, la 1.40, et celles d’après.`,
        marks: [{ kind: 'out', href: GAME }]
      },
      {
        said: msg`<0>Dofus 2 et Dofus 3 ne sont pas concernés.</0> Ils n’ont ni les mêmes fenêtres ni les mêmes notifications.`,
        marks: [{ kind: 'stress' }]
      }
    ]
  },
  allowed: {
    ask: msg`Ankama l’autorise ?`,
    answer: [{ said: PAGE_PROMISES.ankama }, { said: NO_HARM }]
  }
} as const satisfies Record<AskId, Ask>

export const FAQ_ASKS = [
  'inside',
  'risk',
  'safe',
  'machine',
  'modern',
  'parity',
  'macFullScreen',
  'count',
  'tongue',
  'money'
] as const satisfies readonly AskId[]

export const PAGE_QUESTIONS = {
  home: null,
  autoFocus: null,
  wheel: null,
  walk: null,
  runeTable: null,
  relay: null,
  quickTexts: null,
  mac: ['macFloor', 'monterey', 'macAccess', 'macFullScreen'],
  windows: [
    'warning',
    'count',
    'eleven',
    'seven',
    'windowsAccess',
    'modern',
    'allowed'
  ],
  comparison: null,
  download: ['free', 'risk', 'safe', 'machine'],
  faq: FAQ_ASKS,
  journal: null,
  ankama: null,
  legal: null
} as const satisfies Record<PageId, readonly AskId[] | null>
