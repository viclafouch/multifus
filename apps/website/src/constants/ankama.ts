import { msg } from '@lingui/core/macro'
import forumShot from '@multifus/ankama/images/tolerance-forum.webp'
import postShot from '@multifus/ankama/images/tolerance-post.webp'
import { ChatsCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatsCircle'
import { ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr/XLogo'
import type { AnkamaSource, AnkamaSourceId } from '@/@types/ankama'
import type { Point, Rule } from '@/@types/body'
import { ANKAMA_FORUM, ANKAMA_POST } from '@/constants/site'

export const ANKAMA_SOURCE_IDS = [
  'post',
  'forum'
] as const satisfies readonly AnkamaSourceId[]

export const ANKAMA_SOURCES = {
  post: {
    icon: XLogoIcon,
    name: msg`Le compte Dofus Retro sur X`,
    date: msg`Le 10 mars 2026`,
    alt: msg`Copie du message publié par le compte Dofus Retro sur X.`,
    quote:
      'L’utilisation d’un logiciel tiers est tolérée UNIQUEMENT s’il ne modifie/n’interagit pas avec les fichiers du jeu ou le jeu en lui-même.',
    shot: { src: postShot, width: 1176, height: 816 },
    href: ANKAMA_POST
  },
  forum: {
    icon: ChatsCircleIcon,
    name: msg`Le forum de Dofus Retro`,
    date: msg`Le 1ᵉʳ avril 2026`,
    alt: msg`Copie de la réponse de l’équipe Ankama sur le forum de Dofus Retro.`,
    quote:
      'Nous avons une certaine tolérance pour ce qui est des logiciels de "gestion de fenêtres" [...] L’utilisation de macros apportant un avantage déloyal, comme le déplacement de plusieurs personnages simultanément sans changer de fenêtre, est strictement bannissable.',
    shot: { src: forumShot, width: 1400, height: 982 },
    href: ANKAMA_FORUM
  }
} as const satisfies Record<AnkamaSourceId, AnkamaSource>

export const ANKAMA_RULES = [
  {
    tone: 'kept',
    icon: ShieldCheckIcon,
    title: msg`Ce qu’Ankama tolère`,
    lines: [
      msg`Ranger et changer les fenêtres du jeu`,
      msg`Une action, un seul personnage`,
      msg`Ne rien lire et ne rien changer dans le jeu`
    ],
    verdict: msg`Multifus ne fait que ça.`
  },
  {
    tone: 'banned',
    icon: ProhibitIcon,
    title: msg`Ce qui fait bannir`,
    lines: [
      msg`Les macros, quelles qu’elles soient`,
      msg`Déplacer plusieurs personnages d’un coup`,
      msg`Ouvrir ou modifier les fichiers du jeu`
    ],
    verdict: msg`Multifus n’en fait rien.`
  }
] as const satisfies readonly Rule[]

export const ANKAMA_LIMIT = [
  {
    lead: msg`Une tolérance n’est pas une autorisation.`,
    line: msg`Ankama peut changer d’avis. Ce jour-là, Multifus s’arrête.`
  },
  {
    lead: msg`Ankama ne répond pas de Multifus.`,
    line: msg`Aucun logiciel de la communauté n’est soutenu par le jeu. Vous l’installez sous votre responsabilité.`
  }
] as const satisfies readonly Point[]
