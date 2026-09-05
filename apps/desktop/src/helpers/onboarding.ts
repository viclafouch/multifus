import { plural, t } from '@lingui/core/macro'
import type {
  Check,
  KnownCheck,
  Onboarding,
  Page,
  Step,
  SystemPage
} from '@/@types/onboarding'
import { IS_APPLE } from '@/constants/keyboard'
import type { Shot } from '@/constants/onboarding'
import { PAGE_SHOTS, SYSTEM_PAGES, WELCOME_PAGE } from '@/constants/onboarding'
import { quoted, systemWords } from '@/helpers/wording'

export const pagesOf = (onboarding: Onboarding): readonly Page[] => {
  return [
    WELCOME_PAGE,
    ...onboarding.steps.map(({ step }) => {
      return step
    })
  ]
}

export const matchIsAsking = (onboarding: Onboarding) => {
  return onboarding.steps.some(({ check }) => {
    return check === 'blocked'
  })
}

export const pageLabel = (page: Page) => {
  switch (page) {
    case 'welcome': {
      return t`Bienvenue`
    }
    case 'authorization': {
      return t`L’autorisation`
    }
    case 'notifications': {
      return t`Les notifications`
    }
    case 'focus': {
      return t`La concentration`
    }
    case 'gameSetting': {
      return t`Dans le jeu`
    }
    case 'proof': {
      return t`L’essai`
    }
    default: {
      return page satisfies never
    }
  }
}

export const pageTitle = (page: Page) => {
  switch (page) {
    case 'welcome': {
      return t`Vous ne chercherez plus la bonne fenêtre`
    }
    case 'authorization': {
      return IS_APPLE
        ? t`Laissez Multifus voir vos fenêtres`
        : t`Laissez Multifus lire les notifications`
    }
    case 'notifications': {
      return t`Laissez Dofus vous prévenir`
    }
    case 'focus': {
      const name = quoted(systemWords().focus)

      return t`Coupez ${name}`
    }
    case 'gameSetting': {
      const name = quoted(systemWords().backgroundNotifications)

      return t`Cochez ${name}`
    }
    case 'proof': {
      return t`On essaie pour de vrai`
    }
    default: {
      return page satisfies never
    }
  }
}

const pageBody = (page: Page) => {
  switch (page) {
    case 'welcome': {
      return t`Gardez vos huit clients ouverts sans jamais chercher lequel vous appelle. Multifus regarde à votre place, et voici tout ce qu’il sait faire.`
    }
    case 'authorization': {
      return IS_APPLE
        ? t`Cliquez sur le bouton, puis cochez Multifus dans la liste. Sans cette autorisation, il ne voit aucune fenêtre et ne ramènera personne devant vous.`
        : t`Cliquez sur le bouton, puis cochez Multifus dans la liste. Sans cette autorisation, il n’entend pas Dofus et ne ramènera personne devant vous.`
    }
    case 'notifications': {
      const game = quoted(systemWords().game)

      return t`Trouvez ${game} dans la liste et laissez-le envoyer des notifications. Combat, échange, défi, percepteur : tout passe par là.`
    }
    case 'focus': {
      return t`Éteignez-la. Allumée, elle retient les notifications : votre percepteur se fait taper à l’autre bout du monde et vous ne l’apprenez qu’en rentrant.`
    }
    case 'gameSetting': {
      const options = quoted(systemWords().options)

      return t`Ouvrez les ${options} de Dofus et cochez la case. Sans elle, le client se tait dès qu’il passe derrière, et Multifus n’a plus rien à écouter.`
    }
    case 'proof': {
      return t`Lancez Dofus et connectez un personnage. Recevez ensuite un message privé ou entrez en combat : sa fenêtre passera devant toute seule.`
    }
    default: {
      return page satisfies never
    }
  }
}

export const pageHead = (page: Page, check: Check) => {
  if (page === 'proof' && check === 'ready') {
    return {
      title: t`Tout est en place`,
      body: t`Retrouvez tout ce qui suit dans la barre de gauche.`
    }
  }

  return { title: pageTitle(page), body: pageBody(page) }
}

export const pageWay = (page: Page) => {
  const words = systemWords()

  switch (page) {
    case 'authorization': {
      return IS_APPLE
        ? [words.settings, words.accessibility]
        : [words.settings, words.privacy, words.notifications]
    }
    case 'notifications': {
      return IS_APPLE
        ? [words.settings, words.notifications, words.game]
        : [words.settings, words.system, words.notifications]
    }
    case 'focus': {
      return [words.settings, words.focus]
    }
    case 'gameSetting': {
      return [words.options, words.general, words.miscellaneous]
    }
    case 'welcome':
    case 'proof': {
      return []
    }
    default: {
      return page satisfies never
    }
  }
}

const readyLine = (step: Step, proven: boolean) => {
  switch (step) {
    case 'authorization': {
      return IS_APPLE
        ? t`Multifus voit vos fenêtres.`
        : t`Multifus entend le jeu.`
    }
    case 'proof': {
      return t`Le jeu vous a appelé, Multifus l’a entendu.`
    }
    case 'notifications':
    case 'focus':
    case 'gameSetting': {
      return proven
        ? t`C’est en place : le jeu a réussi à vous appeler.`
        : t`C’est en place : Multifus a lu le réglage.`
    }
    default: {
      return step satisfies never
    }
  }
}

const blockedLine = (step: Step) => {
  switch (step) {
    case 'authorization': {
      return IS_APPLE
        ? t`Multifus ne voit rien, et ne peut rien faire.`
        : t`Multifus n’entend rien, et ne peut rien faire.`
    }
    case 'notifications':
    case 'focus':
    case 'gameSetting':
    case 'proof': {
      return t`Ce n’est pas en place.`
    }
    default: {
      return step satisfies never
    }
  }
}

type CheckLineParams = Readonly<{
  step: Step
  check: KnownCheck
  proven: boolean
}>

export const checkLine = ({ step, check, proven }: CheckLineParams) => {
  return check === 'ready' ? readyLine(step, proven) : blockedLine(step)
}

type ProofHeadingParams = Readonly<{
  isDone: boolean
  online: number
}>

export const proofHeading = ({ isDone, online }: ProofHeadingParams) => {
  if (isDone) {
    return checkLine({ step: 'proof', check: 'ready', proven: true })
  }

  if (online === 0) {
    return t`Aucun personnage connecté`
  }

  return plural(online, {
    one: 'Multifus voit # personnage',
    other: 'Multifus voit # personnages'
  })
}

export type Lead =
  | Readonly<{ kind: 'ask' }>
  | Readonly<{ kind: 'open'; systemPage: SystemPage }>
  | Readonly<{ kind: 'show'; shot: Shot }>
  | Readonly<{ kind: 'next' }>
  | Readonly<{ kind: 'none' }>

export const leadOf = (page: Page, isReady: boolean): Lead => {
  if (isReady) {
    return { kind: 'next' }
  }

  if (page === 'authorization') {
    return { kind: 'ask' }
  }

  const systemPage = SYSTEM_PAGES[page]

  if (systemPage !== null) {
    return { kind: 'open', systemPage }
  }

  const shot = PAGE_SHOTS[page]

  if (shot !== null) {
    return { kind: 'show', shot }
  }

  return page === 'proof' ? { kind: 'none' } : { kind: 'next' }
}

type NextLabelParams = Readonly<{
  page: Page
  rank: number
  count: number
  isReady: boolean
}>

export const nextLabel = ({ page, rank, count, isReady }: NextLabelParams) => {
  if (rank === count) {
    return isReady ? t`Terminer` : t`Je verrai plus tard`
  }

  if (rank === 1) {
    return t`C’est parti`
  }

  return isReady || page === 'authorization' ? t`Continuer` : t`C’est fait`
}
