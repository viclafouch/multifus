import { beforeEach, describe, expect, it } from 'vitest'
import type { Check } from '@/@types/onboarding'
import type { HealthRead } from '@/hooks/use-health-check'
import { onboardingOf, speakFrench } from '@/test-doubles'

const READ: HealthRead = { kind: 'read' }

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

describe('the verdict of the check', () => {
  beforeEach(async () => {
    await speakFrench()
  })

  it('says the read is going on before saying anything else', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(['blocked']),
      isAutoFocusEnabled: false,
      read: { kind: 'reading' }
    })

    expect(report.verdict).toBe('Multifus relit les réglages')
    expect(report.check).toBe('reading')
    expect(report.move).toBeNull()
  })

  it('admits the failed read, and then offers no move that leads away', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(ALL_READY),
      isAutoFocusEnabled: true,
      read: { kind: 'failed', detail: 'le pont n’a pas répondu' }
    })

    expect(report.verdict).toBe('Multifus n’a pas pu relire les réglages')
    expect(report.check).toBe('blocked')
    expect(report.move).toBeNull()
  })

  it('says AutoFocus is off before everything else', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(['blocked']),
      isAutoFocusEnabled: false,
      read: READ
    })

    expect(report.verdict).toBe('L’AutoFocus est éteint')
    expect(report.move).toBe('autoFocus')
    expect(report.check).toBeNull()
  })

  it('counts the closed settings, in the singular as in the plural', async () => {
    const { healthReport } = await import('@/helpers/health')

    const alone = healthReport({
      onboarding: onboardingWhere(['blocked']),
      isAutoFocusEnabled: true,
      read: READ
    })

    const several = healthReport({
      onboarding: onboardingWhere(['blocked', 'blocked', 'blocked']),
      isAutoFocusEnabled: true,
      read: READ
    })

    expect(alone.verdict).toBe('1 réglage n’est pas en place')
    expect(several.verdict).toBe('3 réglages ne sont pas en place')
    expect(several.move).toBe('onboarding')
  })

  it('admits what it cannot read, and hands over the questions', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(['ready', 'unknown', 'ready', 'ready']),
      isAutoFocusEnabled: true,
      read: READ
    })

    expect(report.verdict).toBe('Multifus ne peut pas tout lire ici')
    expect(report.move).toBe('questions')
    expect(report.check).toBeNull()
  })

  it('reassures when everything is open', async () => {
    const { healthReport } = await import('@/helpers/health')

    const report = healthReport({
      onboarding: onboardingWhere(ALL_READY),
      isAutoFocusEnabled: true,
      read: READ
    })

    expect(report.verdict).toBe('Tout est en place')
    expect(report.move).toBeNull()
    expect(report.check).toBe('ready')
  })
})
