import type { Language } from '@/@types/language'
import type { Page, StepStatus } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import { FeatureRoll } from '@/components/retro/features'
import { SettingPath } from '@/components/retro/setting-path'
import { StepState } from '@/components/retro/step-state'
import { checkLine, pageHead, pageWay } from '@/helpers/onboarding'
import { useArrival } from '@/hooks/use-arrival'
import { ProofBand } from '@/screens/onboarding/proof-band'
import { StepActions } from '@/screens/onboarding/step-actions'

type StepPageProps = Readonly<{
  page: Page
  status: StepStatus | null
  characters: readonly Character[]
  language: Language
  rank: number
  count: number
  stepCount: number
  onNext: () => void
  onAsk: () => void
}>

export const StepPage = ({
  page,
  status,
  characters,
  language,
  rank,
  count,
  stepCount,
  onNext,
  onAsk
}: StepPageProps) => {
  const title = useArrival()
  const way = pageWay(page)
  const check = status?.check ?? 'unknown'
  const head = pageHead({ page, check, stepCount })
  const isProof = page === 'proof'

  return (
    <section className="flex min-h-full w-full flex-col justify-center">
      <div
        data-wide={isProof ? '' : undefined}
        className="plate unfurl group mx-auto w-full max-w-scene data-wide:max-w-roll"
      >
        <div className="flex flex-col items-center gap-4 px-8 py-6 text-center group-data-wide:py-4">
          <h1
            ref={title}
            tabIndex={-1}
            className="lift lift-1 limelight font-carve text-sign tracking-wide text-balance text-cream uppercase outline-none"
          >
            {head.title}
          </h1>
          {isProof ? null : (
            <span aria-hidden className="lift lift-1 crest w-crest" />
          )}
          <p className="lift lift-2 max-w-tale text-tale text-balance text-khaki">
            {head.body}
          </p>
          {way.length === 0 ? null : (
            <div className="lift lift-3">
              <SettingPath path={way} />
            </div>
          )}
          {isProof ? (
            <div className="lift lift-3 w-full">
              <ProofBand characters={characters} check={check} />
            </div>
          ) : null}
          {isProof ? <FeatureRoll /> : null}
          {isProof || status === null || status.check === 'unknown' ? null : (
            <div className="lift lift-4">
              <StepState
                check={status.check}
                line={checkLine({
                  step: status.step,
                  check: status.check,
                  proven: status.proven
                })}
              />
            </div>
          )}
          <div className="lift lift-5 pt-1">
            <StepActions
              page={page}
              language={language}
              rank={rank}
              count={count}
              isReady={check === 'ready'}
              onNext={onNext}
              onAsk={onAsk}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
