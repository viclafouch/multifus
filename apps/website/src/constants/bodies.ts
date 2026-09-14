import { msg } from '@lingui/core/macro'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { ArrowUUpLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowUUpLeft'
import { BellRingingIcon } from '@phosphor-icons/react/dist/ssr/BellRinging'
import { BrowsersIcon } from '@phosphor-icons/react/dist/ssr/Browsers'
import { CertificateIcon } from '@phosphor-icons/react/dist/ssr/Certificate'
import { ChatTextIcon } from '@phosphor-icons/react/dist/ssr/ChatText'
import { CrosshairSimpleIcon } from '@phosphor-icons/react/dist/ssr/CrosshairSimple'
import { CursorClickIcon } from '@phosphor-icons/react/dist/ssr/CursorClick'
import { DropIcon } from '@phosphor-icons/react/dist/ssr/Drop'
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye'
import { FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag'
import { HourglassHighIcon } from '@phosphor-icons/react/dist/ssr/HourglassHigh'
import { KeyboardIcon } from '@phosphor-icons/react/dist/ssr/Keyboard'
import { KeyReturnIcon } from '@phosphor-icons/react/dist/ssr/KeyReturn'
import { ListNumbersIcon } from '@phosphor-icons/react/dist/ssr/ListNumbers'
import { MoonStarsIcon } from '@phosphor-icons/react/dist/ssr/MoonStars'
import { PaletteIcon } from '@phosphor-icons/react/dist/ssr/Palette'
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected'
import { PowerIcon } from '@phosphor-icons/react/dist/ssr/Power'
import { PushPinIcon } from '@phosphor-icons/react/dist/ssr/PushPin'
import { SlidersHorizontalIcon } from '@phosphor-icons/react/dist/ssr/SlidersHorizontal'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { StackSimpleIcon } from '@phosphor-icons/react/dist/ssr/StackSimple'
import { StorefrontIcon } from '@phosphor-icons/react/dist/ssr/Storefront'
import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr/TelegramLogo'
import { TranslateIcon } from '@phosphor-icons/react/dist/ssr/Translate'
import { UserCheckIcon } from '@phosphor-icons/react/dist/ssr/UserCheck'
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree'
import type { Body } from '@/@types/body'
import type { PageId } from '@/@types/page'

export const PAGE_BODIES = {
  home: null,
  autoFocus: {
    lead: msg`Vous jouez sur votre Iop, et c’est votre Eniripsa qu’on invite. Sa fenêtre arrive devant vous toute seule.`,
    boons: [
      {
        icon: BellRingingIcon,
        title: msg`Sept appels surveillés`,
        line: msg`Échange, groupe, guilde, message privé, défi, craft, percepteur attaqué.`
      },
      {
        icon: HourglassHighIcon,
        title: msg`Votre tour de jouer`,
        line: msg`La bonne fenêtre est devant vous avant que le chrono ne descende.`
      },
      {
        icon: SlidersHorizontalIcon,
        title: msg`Un interrupteur par appel`,
        line: msg`Les crafts des autres ne vous intéressent pas ? Coupez celui-là, gardez les six autres.`
      },
      {
        icon: MoonStarsIcon,
        title: msg`Une mule se met de côté`,
        line: msg`Sa fenêtre ne passe plus devant tant que vous ne la rappelez pas.`
      }
    ],
    caveats: [
      msg`Il entend ce que le jeu annonce lui-même, et ne lit rien dans sa mémoire.`
    ]
  },
  wheel: {
    lead: msg`Vous maintenez une combinaison, un disque de têtes s’ouvre au milieu de l’écran, vous visez, vous lâchez.`,
    boons: [
      {
        icon: CrosshairSimpleIcon,
        title: msg`Viser plutôt que se souvenir`,
        line: msg`Vous reconnaissez la tête de classe et le pseudo, et vous partez dessus.`
      },
      {
        icon: KeyboardIcon,
        title: msg`Une touche par personnage tient jusqu’à quatre`,
        line: msg`À huit, vous cherchez si votre Crâ est sur F5 ou sur F6 plus longtemps que vous ne jouez.`
      },
      {
        icon: PaletteIcon,
        title: msg`Deux Sadidas femmes se séparent`,
        line: msg`La couleur que vous leur donnez les distingue là où le portrait ne suffit plus.`
      },
      {
        icon: ArrowUUpLeftIcon,
        title: msg`Lâchez au centre, rien ne se passe`,
        line: msg`Un geste commencé par erreur ne coûte pas une fenêtre.`
      }
    ],
    caveats: [
      msg`Tant que le disque est ouvert, le jeu ne voit plus votre souris : aucun sort ne part.`,
      msg`Elle montre les personnages connectés, et n’en reconnecte aucun.`
    ]
  },
  walk: {
    lead: msg`Vous allumez le Déplacement rapide, vous cliquez là où vous voulez aller, et c’est le personnage suivant qui arrive devant vous.`,
    boons: [
      {
        icon: CursorClickIcon,
        title: msg`Quatre clics, quatre personnages`,
        line: msg`Le nombre de clics ne change pas : c’est la recherche de fenêtre entre deux clics qui disparaît.`
      },
      {
        icon: FlagIcon,
        title: msg`Une bannière dit où vous en êtes`,
        line: msg`Elle se pose au coin que vous avez choisi et nomme le personnage qui vient d’arriver.`
      },
      {
        icon: ListNumbersIcon,
        title: msg`L’ordre du défilement est le vôtre`,
        line: msg`La mule que vous laissez en banque ne prend aucun de vos clics.`
      },
      {
        icon: PowerIcon,
        title: msg`Il démarre toujours éteint`,
        line: msg`Une touche l’allume, et il s’éteint dès qu’il n’a plus de fenêtre où aller.`
      }
    ],
    caveats: []
  },
  runeTable: {
    lead: msg`Le tableau des poids de runes se pose par-dessus la fenêtre du jeu, à la touche que vous avez choisie.`,
    boons: [
      {
        icon: BrowsersIcon,
        title: msg`Le navigateur reste fermé`,
        line: msg`Plus d’aller-retour vers un onglet à chaque objet brisé.`
      },
      {
        icon: PushPinIcon,
        title: msg`Il garde sa place`,
        line: msg`Posé où vous voulez, il y revient au lancement suivant et suit la fenêtre quand elle bouge.`
      },
      {
        icon: DropIcon,
        title: msg`Taille et transparence se règlent`,
        line: msg`Poussé à fond, il reste toujours assez visible pour se lire.`
      },
      {
        icon: EyeIcon,
        title: msg`La même touche le cache et le rappelle`,
        line: msg`Et un bouton le repose au coin de la fenêtre du jeu quand vous l’avez perdu de vue.`
      }
    ],
    caveats: [
      msg`Le jeu garde le premier plan : un clic sur le tableau ne fait pas sauter Multifus devant.`,
      msg`Il ne se pose pas sur un client en plein écran, où une fenêtre agrandie fait mieux le travail.`
    ]
  },
  relay: {
    lead: msg`Vous êtes parti manger, vos personnages sont restés connectés, et quelqu’un vous écrit en privé.`,
    boons: [
      {
        icon: TelegramLogoIcon,
        title: msg`Par Telegram, sur votre téléphone`,
        line: msg`Chaque message nomme le personnage qu’on vient d’appeler.`
      },
      {
        icon: StorefrontIcon,
        title: msg`Le commerce continue sans vous`,
        line: msg`Une annonce en vente attend des réponses, et l’acheteur ne repart plus faute de vous.`
      },
      {
        icon: UserCheckIcon,
        title: msg`Vous choisissez qui est suivi`,
        line: msg`Votre principal oui, vos mules non.`
      },
      {
        icon: PlugsConnectedIcon,
        title: msg`Il vous dit aussi quand il se tait`,
        line: msg`Dofus Retro déconnecte un personnage qui ne fait rien, et le relais l’annonce.`
      }
    ],
    caveats: [
      msg`Le relais va dans un sens : vous ne répondez pas depuis le téléphone.`,
      msg`Il porte le privé, et rien du canal commerce, de la guilde ou du recrutement.`
    ]
  },
  quickReplies: {
    lead: msg`Vous rangez une phrase sous une combinaison de touches. Dans le jeu, vous appuyez, et elle se pose là où vous êtes en train d’écrire.`,
    boons: [
      {
        icon: ChatTextIcon,
        title: msg`Les phrases qu’on retape vingt fois par jour`,
        line: msg`Je vends des runes, je reviens dans deux minutes, bienvenue dans la guilde.`
      },
      {
        icon: UsersThreeIcon,
        title: msg`Elles suivent tous vos personnages`,
        line: msg`La même combinaison marche sur n’importe lequel d’entre eux.`
      },
      {
        icon: KeyReturnIcon,
        title: msg`C’est vous qui appuyez sur Entrée`,
        line: msg`Vous voyez ce qui part avant que ça parte, et vous pouvez encore le corriger.`
      },
      {
        icon: TranslateIcon,
        title: msg`Elles s’écrivent dans la langue du jeu`,
        line: msg`Celle qu’un premier lancement vous offre est en français, même si vous lisez Multifus en anglais.`
      }
    ],
    caveats: [msg`Elles posent du texte sur une ligne, et rien d’autre.`]
  },
  mac: {
    lead: msg`Multifus tourne sur macOS avec les mêmes mécanismes que sur Windows, dans un paquet signé et notarisé par Apple.`,
    boons: [
      {
        icon: AppleLogoIcon,
        title: msg`Rien à contourner pour l’installer`,
        line: msg`Pas de clic droit pour forcer l’ouverture, aucun avertissement sur un auteur non vérifié.`
      },
      {
        icon: StackSimpleIcon,
        title: msg`Ce n’est pas un portage`,
        line: msg`Les deux systèmes sont construits à partir du même code.`
      },
      {
        icon: SquaresFourIcon,
        title: msg`Les six mécanismes sont là`,
        line: msg`Et la touche s’écrit comme sur votre clavier.`
      },
      {
        icon: CertificateIcon,
        title: msg`Signer coûte de l’argent chaque année`,
        line: msg`C’est pour ça que si peu de projets gratuits le font, et le comparatif le montre.`
      }
    ],
    caveats: [
      msg`Le paquet est construit pour Apple Silicon, et ne vise pas les Mac Intel.`,
      msg`Le pseudo, la tête de classe et le bouton par personnage n’existent que sur la barre des tâches de Windows.`,
      msg`Un client en plein écran prend un bureau à lui, et la bascule devient un glissement d’un bureau à l’autre.`
    ]
  },
  comparison: null,
  download: null,
  journal: null,
  ankama: null,
  legal: null
} as const satisfies Record<PageId, Body | null>
