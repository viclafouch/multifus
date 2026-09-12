import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import forumShot from '@multifus/ankama/images/tolerance-forum.webp'
import postShot from '@multifus/ankama/images/tolerance-post.webp'
import type { AnkamaWord, AnkamaWordId } from '@/@types/ankama'
import type { Point } from '@/@types/body'
import { ANKAMA_FORUM, ANKAMA_POST } from '@/constants/site'

export const ANKAMA_WORD_IDS = [
  'post',
  'forum'
] as const satisfies readonly AnkamaWordId[]

export const ANKAMA_WORDS = {
  post: {
    shot: postShot,
    quote:
      'L’utilisation d’un logiciel tiers est tolérée UNIQUEMENT s’il ne modifie/n’interagit pas avec les fichiers du jeu ou le jeu en lui-même.',
    href: ANKAMA_POST
  },
  forum: {
    shot: forumShot,
    quote:
      'Nous avons une certaine tolérance pour ce qui est des logiciels de « gestion de fenêtres », mais il est important de rappeler qu’il ne s’agit pas d’outils officiellement pris en charge par Ankama.',
    href: ANKAMA_FORUM
  }
} as const satisfies Record<AnkamaWordId, AnkamaWord>

export const ANKAMA_WORD_NAMES = {
  post: msg`le compte Dofus Retro sur X, le 10 mars 2026`,
  forum: msg`le forum de Dofus Retro, le 1ᵉʳ avril 2026`
} as const satisfies Record<AnkamaWordId, MessageDescriptor>

export const ANKAMA_WORD_ALTS = {
  post: msg`Copie du message publié par le compte Dofus Retro sur X.`,
  forum: msg`Copie de la réponse de l’équipe Ankama sur le forum de Dofus Retro.`
} as const satisfies Record<AnkamaWordId, MessageDescriptor>

export const ANKAMA_KEPT = [
  {
    lead: msg`Il ne touche pas au jeu.`,
    line: msg`Aucun fichier de Dofus n’est lu ni modifié, et sa mémoire n’est jamais regardée. C’est la seule condition qu’Ankama a posée.`
  },
  {
    lead: msg`Un clic, un personnage.`,
    line: msg`Aucun geste ne déplace deux personnages à la fois. C’est exactement la macro qu’Ankama dit bannissable.`
  },
  {
    lead: msg`Rien d’officiel.`,
    line: msg`Ankama ne soutient pas Multifus et n’en répond pas. Personne ne peut vous promettre le contraire.`
  }
] as const satisfies readonly Point[]

export const ANKAMA_LIMIT = [
  {
    lead: msg`Une tolérance n’est pas une autorisation.`,
    line: msg`Ankama peut changer d’avis, et ce jour-là Multifus s’arrête.`
  },
  {
    lead: msg`Vous installez sous votre responsabilité.`,
    line: msg`Ankama l’écrit lui-même dans les deux messages ci-dessus.`
  }
] as const satisfies readonly Point[]
