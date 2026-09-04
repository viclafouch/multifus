import { t } from '@lingui/core/macro'
import type { Page, StepStatus } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import { pageHead, pageWay } from '@/helpers/onboarding'
import { CheckBadge } from '@/screens/onboarding/check-badge'
import { ProofBand } from '@/screens/onboarding/proof-band'
import { SettingWay } from '@/screens/onboarding/setting-way'
import { StepActions } from '@/screens/onboarding/step-actions'
import { StepFigure } from '@/screens/onboarding/step-figure'

type StepPageProps = Readonly<{
  page: Page
  status: StepStatus | null
  characters: readonly Character[]
  rank: number
  count: number
  onNext: () => void
  onAsk: () => void
}>

export const StepPage = ({
  page,
  status,
  characters,
  rank,
  count,
  onNext,
  onAsk
}: StepPageProps) => {
  const way = pageWay(page)
  const check = status?.check ?? 'unknown'
  const head = pageHead(page, check)
  const isProof = page === 'proof'

  return (
    <section className="mx-auto flex min-h-full w-full max-w-stage flex-col items-center justify-center gap-3.5 text-center">
      <p className="rise font-mono text-micro tracking-micro text-primary/80 uppercase">
        {t`Étape ${rank} sur ${count}`}
      </p>
      <h1 className="rise font-display text-hero font-semibold text-balance tracking-hero short:text-title">
        {head.title}
      </h1>
      <p className="rise rise-late max-w-lead text-lead text-pretty text-muted-foreground">
        {head.body}
      </p>
      {way.length === 0 ? null : (
        <div className="rise rise-late">
          <SettingWay way={way} align="center" />
        </div>
      )}
      {isProof ? (
        <ProofBand characters={characters} check={check} />
      ) : (
        <StepFigure page={page} />
      )}
      {isProof || status === null || status.check === 'unknown' ? null : (
        <CheckBadge step={status.step} check={status.check} />
      )}
      <StepActions
        page={page}
        rank={rank}
        count={count}
        isReady={check === 'ready'}
        onNext={onNext}
        onAsk={onAsk}
      />
    </section>
  )
}
