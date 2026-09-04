import { t } from '@lingui/core/macro'
import type { KnownCheck, Onboarding, Page, Step } from '@/@types/onboarding'
import { IS_APPLE } from '@/constants/keyboard'
import { WELCOME_PAGE } from '@/constants/onboarding'
import { quoted, systemWords } from '@/helpers/wording'

const GAME_IN_SYSTEM = 'Dofus Retro'

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
      return t`Bienvenue dans Multifus`
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

export const pageBody = (page: Page) => {
  switch (page) {
    case 'welcome': {
      return t`Multifus surveille vos fenêtres Dofus Retro. Un seul personnage ou dix, il vous amène toujours devant la bonne.`
    }
    case 'authorization': {
      return IS_APPLE
        ? t`Sans cette autorisation, Multifus ne voit pas vos fenêtres Dofus et n’amènera aucun personnage devant vous.`
        : t`Sans cette autorisation, Multifus n’entend pas Dofus et n’amènera aucun personnage devant vous.`
    }
    case 'notifications': {
      return t`Multifus écoute les notifications de Dofus : c’est comme ça qu’il sait quel personnage vous appelle.`
    }
    case 'focus': {
      return t`La concentration coupe les notifications. Multifus n’entend plus rien, et vos personnages restent derrière.`
    }
    case 'gameSetting': {
      return t`Sans cette case cochée, Dofus n’envoie aucune notification, et Multifus n’a plus rien à écouter.`
    }
    case 'proof': {
      return t`Ouvrez Dofus et connectez un personnage : il apparaît ici. Faites-vous ensuite appeler dans le jeu.`
    }
    default: {
      return page satisfies never
    }
  }
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
        ? [words.settings, words.notifications, GAME_IN_SYSTEM]
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

const readyLine = (step: Step) => {
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
      return t`C’est en place : le jeu a réussi à vous appeler.`
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

export const checkLine = (step: Step, check: KnownCheck) => {
  return check === 'ready' ? readyLine(step) : blockedLine(step)
}
