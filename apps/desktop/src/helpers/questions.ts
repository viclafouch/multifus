import { t } from '@lingui/core/macro'
import { IS_APPLE } from '@/constants/keyboard'
import type { Question } from '@/constants/questions'
import { QUESTION_PAGES } from '@/constants/questions'
import { pageWay } from '@/helpers/onboarding'
import { quoted, systemWords } from '@/helpers/wording'

export const questionLines = (question: Question) => {
  switch (question) {
    case 'banner': {
      const words = systemWords()
      const banners = quoted(t`Afficher les bannières de notification`)
      const centre = quoted(
        t`Afficher les notifications dans le centre de notifications`
      )
      const game = quoted(words.game)

      return {
        asked: t`Une bannière me cache le jeu à chaque message`,
        answer: IS_APPLE
          ? t`Gardez-la : sur Mac, c’est elle qui prévient Multifus. Sans elle, plus personne ne passe devant.`
          : t`Coupez-la sans rien perdre, Multifus entend la notification quand même. Trouvez ${game}, décochez ${banners}, gardez ${centre}.`
      }
    }
    case 'silence': {
      return {
        asked: t`On m’écrit et ma fenêtre ne passe pas devant`,
        answer: t`Reprenez la mise en route : un réglage a pu changer sans le dire, et elle les revoit un par un sans rien annuler de ce qui tient déjà.`
      }
    }
    case 'maximize': {
      const setting = quoted(t`Agrandir les clients à leur ouverture`)

      return {
        asked: t`Mes fenêtres ne s’agrandissent pas quand j’ouvre un client`,
        answer: t`Cochez ${setting} : c’est le seul réglage en jeu.`
      }
    }
    case 'shortcuts': {
      return {
        asked: t`Mes raccourcis ne font rien`,
        answer: t`Cliquez d’abord dans une fenêtre Dofus : ils ne répondent que là. S’ils restent muets, un autre logiciel a pris la même combinaison.`
      }
    }
    case 'gone': {
      return {
        asked: t`Multifus a disparu de l’écran`,
        answer: IS_APPLE
          ? t`Cliquez son icône en haut à droite de l’écran : la croix ne le quitte pas, elle le range, et son menu rouvre la fenêtre sur la map que vous voulez.`
          : t`Cliquez son icône à côté de l’horloge : la croix ne le quitte pas, elle le range, et son menu rouvre la fenêtre sur la map que vous voulez.`
      }
    }
    default: {
      return question satisfies never
    }
  }
}

export const questionWay = (question: Question) => {
  const page = QUESTION_PAGES[question]

  return page === null ? [] : pageWay(page)
}
