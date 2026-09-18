import { msg } from '@lingui/core/macro'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { ArrowSquareUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUp'
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
import { HammerIcon } from '@phosphor-icons/react/dist/ssr/Hammer'
import { HourglassHighIcon } from '@phosphor-icons/react/dist/ssr/HourglassHigh'
import { KeyboardIcon } from '@phosphor-icons/react/dist/ssr/Keyboard'
import { KeyReturnIcon } from '@phosphor-icons/react/dist/ssr/KeyReturn'
import { ListNumbersIcon } from '@phosphor-icons/react/dist/ssr/ListNumbers'
import { LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey'
import { PaletteIcon } from '@phosphor-icons/react/dist/ssr/Palette'
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected'
import { PowerIcon } from '@phosphor-icons/react/dist/ssr/Power'
import { PushPinIcon } from '@phosphor-icons/react/dist/ssr/PushPin'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr/TelegramLogo'
import { TranslateIcon } from '@phosphor-icons/react/dist/ssr/Translate'
import { UserCheckIcon } from '@phosphor-icons/react/dist/ssr/UserCheck'
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree'
import type { Body } from '@/@types/body'
import type { PageId } from '@/@types/page'

export const PAGE_BODIES = {
  home: null,
  autoFocus: {
    lead: msg`Un de vos personnages reçoit une invitation ou un message, et sa fenêtre passe devant vous toute seule.`,
    boons: [
      {
        icon: BellRingingIcon,
        title: msg`Vous choisissez vos déclencheurs`,
        line: msg`Échange, groupe, guilde, message privé, défi, craft, percepteur attaqué.`
      },
      {
        icon: HourglassHighIcon,
        title: msg`Plus un tour perdu`,
        line: msg`La fenêtre du personnage qui joue passe devant dès le début de son tour.`
      },
      {
        icon: ArrowSquareUpIcon,
        title: msg`Même une fenêtre réduite revient`,
        line: msg`Un personnage rangé dans le Dock ou dans la barre des tâches repasse devant vous.`
      },
      {
        icon: UserCheckIcon,
        title: msg`Vous choisissez les personnages inclus`,
        line: msg`Un personnage exclu garde sa fenêtre en arrière-plan tant que vous ne le remettez pas.`
      }
    ]
  },
  wheel: {
    lead: msg`Vous maintenez une combinaison, la roue s’ouvre au milieu de l’écran, vous visez une tête et vous lâchez.`,
    boons: [
      {
        icon: CrosshairSimpleIcon,
        title: msg`La tête de classe suffit`,
        line: msg`Vous reconnaissez le portrait et le pseudo, et vous partez dessus.`
      },
      {
        icon: KeyboardIcon,
        title: msg`Plus de touche à retenir`,
        line: msg`Passé quatre personnages, une touche par fenêtre devient impossible à retenir.`
      },
      {
        icon: PaletteIcon,
        title: msg`Une couleur par personnage`,
        line: msg`Deux personnages de la même classe et du même sexe restent reconnaissables.`
      },
      {
        icon: ArrowUUpLeftIcon,
        title: msg`Un geste s’annule`,
        line: msg`Lâchez au centre de la roue, et aucune fenêtre ne bouge.`
      }
    ]
  },
  walk: {
    lead: msg`Vous allumez le Déplacement rapide, vous cliquez là où vous voulez aller, et c’est le personnage suivant qui arrive devant vous.`,
    boons: [
      {
        icon: CursorClickIcon,
        title: msg`Quatre clics, quatre personnages`,
        line: msg`Vous cliquez quatre fois, sans chercher de fenêtre entre deux clics.`
      },
      {
        icon: FlagIcon,
        title: msg`Une bannière nomme le personnage`,
        line: msg`Elle s’affiche au coin que vous choisissez, à chaque changement de fenêtre.`
      },
      {
        icon: ListNumbersIcon,
        title: msg`Vous choisissez l’ordre`,
        line: msg`Le personnage laissé en banque ne prend aucun de vos clics.`
      },
      {
        icon: PowerIcon,
        title: msg`Rien ne part sans vous`,
        line: msg`Le Déplacement rapide s’allume à une touche, et s’éteint quand il n’a plus de fenêtre où aller.`
      }
    ]
  },
  runeTable: {
    lead: msg`Le tableau des poids de runes se pose par-dessus la fenêtre du jeu, à la touche que vous avez choisie.`,
    boons: [
      {
        icon: BrowsersIcon,
        title: msg`Le navigateur reste fermé`,
        line: msg`Vous ne quittez plus le jeu pour chercher le poids d’une rune.`
      },
      {
        icon: PushPinIcon,
        title: msg`Le tableau garde sa place`,
        line: msg`Il revient au même endroit au lancement suivant, et suit la fenêtre du jeu.`
      },
      {
        icon: DropIcon,
        title: msg`Taille et transparence se règlent`,
        line: msg`Même au maximum de transparence, le tableau reste lisible.`
      },
      {
        icon: EyeIcon,
        title: msg`Le tableau part et revient`,
        line: msg`Un bouton le replace au coin de la fenêtre du jeu si vous le perdez de vue.`
      }
    ]
  },
  relay: {
    lead: msg`Vous êtes parti manger, vos personnages sont restés connectés, et quelqu’un vous écrit en privé.`,
    boons: [
      {
        icon: TelegramLogoIcon,
        title: msg`Par Telegram, sur votre téléphone`,
        line: msg`Chaque message arrive dans la seconde, et leur nombre n’est pas limité.`
      },
      {
        icon: HammerIcon,
        title: msg`Vos métiers montent plus vite`,
        line: msg`On vous écrit pour un craft, vous le savez tout de suite, et la commande ne part pas chez un autre artisan.`
      },
      {
        icon: LockKeyIcon,
        title: msg`Confidentialité et sécurité à 100%`,
        line: msg`Vos messages partent vers votre Telegram, et c’est tout.`
      },
      {
        icon: PlugsConnectedIcon,
        title: msg`Vous savez qui s’est déconnecté`,
        line: msg`Dofus Retro déconnecte un personnage qui ne fait rien, et Multifus vous l’annonce.`
      }
    ]
  },
  quickTexts: {
    lead: msg`Vous rangez une phrase sous une combinaison de touches. Dans le jeu, vous appuyez, et elle s’écrit dans votre champ de discussion.`,
    boons: [
      {
        icon: ChatTextIcon,
        title: msg`Vos phrases les plus répétées`,
        line: msg`« Achète anneau 30 pp, MP moi », « Bon jeu à toi », « Je reviens dans deux minutes ».`
      },
      {
        icon: UsersThreeIcon,
        title: msg`Une phrase, tous vos personnages`,
        line: msg`Vous l’écrivez une fois, et la combinaison marche sur le personnage qui est devant vous.`
      },
      {
        icon: KeyReturnIcon,
        title: msg`C’est vous qui envoyez`,
        line: msg`Le texte se pose dans le champ, et vous le relisez avant d’appuyer sur Entrée.`
      },
      {
        icon: TranslateIcon,
        title: msg`Vos phrases parlent français`,
        line: msg`Les phrases livrées au premier lancement sont en français, même si vous lisez Multifus en anglais.`
      }
    ]
  },
  mac: {
    lead: msg`Presque tous les gestionnaires pour Dofus Retro s’arrêtent à Windows. Multifus est né sur Mac, et c’est de là que part la version Windows.`,
    boons: [
      {
        icon: AppleLogoIcon,
        title: msg`Multifus s’ouvre au premier double-clic`,
        line: msg`Pas de clic droit, pas d’alerte, rien à aller autoriser dans les Réglages.`
      },
      {
        icon: CertificateIcon,
        title: msg`Apple a vérifié le fichier`,
        line: msg`Elle fait payer cette vérification chaque année, et peu de logiciels gratuits la paient.`
      },
      {
        icon: SquaresFourIcon,
        title: msg`Rien ne manque sur Mac`,
        line: msg`Les six fonctionnalités du menu sont là, sans exception.`
      },
      {
        icon: KeyboardIcon,
        title: msg`Vos raccourcis parlent Mac`,
        line: msg`Commande et Option s’affichent comme sur votre clavier, pas Ctrl et Alt.`
      }
    ]
  },
  windows: null,
  comparison: null,
  download: null,
  journal: null,
  ankama: null,
  legal: null
} as const satisfies Record<PageId, Body | null>
