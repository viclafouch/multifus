import { plural, t } from '@lingui/core/macro'
import type { KnownCheck, Onboarding } from '@/@types/onboarding'
import type { Move } from '@/constants/moves'

type HealthParams = Readonly<{
  onboarding: Onboarding
  isAutoFocusEnabled: boolean
}>

type Health = {
  readonly check: KnownCheck | null
  readonly verdict: string
  readonly body: string
  readonly move: Move | null
}

export const healthReport = ({
  onboarding,
  isAutoFocusEnabled
}: HealthParams): Health => {
  if (!isAutoFocusEnabled) {
    return {
      check: null,
      verdict: t`L’AutoFocus est éteint`,
      body: t`Aucune fenêtre ne passera devant tant qu’il l’est. Allumez-le, et Multifus reprend son travail.`,
      move: 'autoFocus'
    }
  }

  const blocked = onboarding.steps.filter(({ check }) => {
    return check === 'blocked'
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
      move: null
    }
  }

  return {
    check: 'ready',
    verdict: t`Tout est en place`,
    body: t`Les réglages dont l’AutoFocus dépend sont ouverts. Une notification de Dofus ramènera la bonne fenêtre devant vous.`,
    move: null
  }
}
