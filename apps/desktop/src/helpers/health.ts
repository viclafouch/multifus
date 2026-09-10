import { plural, t } from '@lingui/core/macro'
import type { Onboarding, Step } from '@/@types/onboarding'
import type { StateMark } from '@/components/retro/step-state'
import type { Move } from '@/constants/moves'
import { SETTING_STEPS } from '@/constants/onboarding'
import type { HealthRead } from '@/hooks/use-health-check'

export type HealthSubject = Readonly<{
  onboarding: Onboarding
  isAutoFocusEnabled: boolean
}>

type HealthParams = HealthSubject &
  Readonly<{
    read: HealthRead
  }>

type Health = {
  readonly check: StateMark | null
  readonly verdict: string
  readonly body: string
  readonly move: Move | null
}

const matchIsSetting = (step: Step) => {
  return SETTING_STEPS.some((setting) => {
    return setting === step
  })
}

export const healthReport = ({
  onboarding,
  isAutoFocusEnabled,
  read
}: HealthParams): Health => {
  if (read.kind === 'reading') {
    return {
      check: 'reading',
      verdict: t`Multifus relit les réglages`,
      body: t`Il regarde d’abord s’il voit vos fenêtres, puis ce que le système le laisse lire.`,
      move: null
    }
  }

  if (read.kind === 'failed') {
    return {
      check: 'blocked',
      verdict: t`Multifus n’a pas pu relire les réglages`,
      body: t`Réessayez. Si ça recommence, le journal en dira plus.`,
      move: null
    }
  }

  if (!isAutoFocusEnabled) {
    return {
      check: null,
      verdict: t`L’AutoFocus est éteint`,
      body: t`Aucune fenêtre ne passera devant tant qu’il l’est. Allumez-le, et Multifus reprend son travail.`,
      move: 'autoFocus'
    }
  }

  const blocked = onboarding.steps.filter(({ step, check }) => {
    return matchIsSetting(step) && check === 'blocked'
  }).length

  if (blocked > 0) {
    return {
      check: 'blocked',
      verdict: plural(blocked, {
        one: `# réglage n’est pas en place`,
        other: `# réglages ne sont pas en place`
      }),
      body: t`Reprenez la mise en route : elle vous mène droit à ceux qui manquent, et n’annule rien de ce qui tient déjà.`,
      move: 'onboarding'
    }
  }

  const isBlind = onboarding.steps.some(({ check }) => {
    return check === 'unknown'
  })

  if (isBlind) {
    return {
      check: null,
      verdict: t`Multifus ne peut pas tout lire ici`,
      body: t`Ce que ce système le laisse lire est en place. Pour le reste, seul un appel du jeu qui vous ramène devant tranchera.`,
      move: 'questions'
    }
  }

  return {
    check: 'ready',
    verdict: t`Tout est en place`,
    body: t`Les réglages dont l’AutoFocus dépend sont ouverts. Une notification de Dofus ramènera la bonne fenêtre devant vous.`,
    move: null
  }
}
