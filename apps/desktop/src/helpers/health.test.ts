import { beforeEach, describe, expect, it } from 'vitest'
import type { Check } from '@/@types/onboarding'
import { onboardingOf, speakFrench } from '@/test-doubles'

const onboardingWhere = (checks: readonly Check[]) => {
  const blank = onboardingOf()

  return onboardingOf({
    steps: blank.steps.map((status, rank) => {
      return { ...status, check: checks[rank] ?? status.check }
    })
  })
}

const ALL_READY: readonly Check[] = [
  'ready',
  'ready',
  'ready',
  'ready',
  'ready'
]

describe('le verdict de la vérification', () => {
  beforeEach(async () => {
    await speakFrench()
  })

  it('dit l’AutoFocus éteint avant tout le reste', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(['blocked']),
      isAutoFocusEnabled: false
    })

    expect(report.verdict).toBe('L’AutoFocus est éteint')
    expect(report.move).toBe('autoFocus')
    expect(report.check).toBeNull()
  })

  it('compte les réglages fermés, au singulier comme au pluriel', async () => {
    const { healthReport } = await import('@/helpers/health')

    const alone = healthReport({
      onboarding: onboardingWhere(['blocked']),
      isAutoFocusEnabled: true
    })

    const several = healthReport({
      onboarding: onboardingWhere(['blocked', 'blocked', 'blocked']),
      isAutoFocusEnabled: true
    })

    expect(alone.verdict).toBe('1 réglage n’est pas en place')
    expect(several.verdict).toBe('3 réglages ne sont pas en place')
    expect(several.move).toBe('onboarding')
  })

  it('avoue ce qu’il ne sait pas lire, et n’offre alors aucun geste', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(['ready', 'unknown', 'ready', 'ready']),
      isAutoFocusEnabled: true
    })

    expect(report.verdict).toBe('Multifus ne peut pas tout lire ici')
    expect(report.move).toBeNull()
    expect(report.check).toBeNull()
  })

  it('rassure quand tout est ouvert', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(ALL_READY),
      isAutoFocusEnabled: true
    })

    expect(report.verdict).toBe('Tout est en place')
    expect(report.move).toBeNull()
    expect(report.check).toBe('ready')
  })
})
