import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Page } from '@/@types/onboarding'
import { SystemPageButton } from '@/components/system-page-button'
import { Button } from '@/components/ui/button'
import { PAGE_SHOTS, SYSTEM_PAGES } from '@/constants/onboarding'
import { ShotDialog } from '@/screens/onboarding/shot-dialog'

type StepActionsProps = Readonly<{
  page: Page
  rank: number
  count: number
  isReady: boolean
  onNext: () => void
  onAsk: () => void
}>

export const StepActions = ({
  page,
  rank,
  count,
  isReady,
  onNext,
  onAsk
}: StepActionsProps) => {
  const systemPage = SYSTEM_PAGES[page]
  const shot = PAGE_SHOTS[page]
  const isAsking = page === 'authorization' && !isReady
  const isOpening = systemPage !== null && !isAsking && !isReady
  const isShowing = shot !== null && !isReady

  return (
    <div className="rise rise-later flex flex-wrap items-center justify-center gap-2.5">
      {systemPage === null ? null : (
        <SystemPageButton
          page={systemPage}
          variant={isOpening ? 'outline' : 'ghost'}
          size="default"
        />
      )}
      {isAsking ? (
        <Button variant="outline" onClick={onAsk}>
          <ShieldCheck aria-hidden />
          {t`Autoriser Multifus`}
        </Button>
      ) : null}
      {shot === null ? null : (
        <ShotDialog
          source={shot.full}
          alt={i18n._(shot.alt)}
          variant={isShowing ? 'outline' : 'ghost'}
          size="default"
        />
      )}
      <NextButton
        page={page}
        rank={rank}
        count={count}
        isReady={isReady}
        onNext={onNext}
      />
    </div>
  )
}

type NextButtonProps = Readonly<{
  page: Page
  rank: number
  count: number
  isReady: boolean
  onNext: () => void
}>

const NextButton = ({
  page,
  rank,
  count,
  isReady,
  onNext
}: NextButtonProps) => {
  if (rank === count) {
    return isReady ? (
      <Button onClick={onNext}>{t`Terminer`}</Button>
    ) : (
      <Button variant="outline" onClick={onNext}>
        {t`Je verrai plus tard`}
      </Button>
    )
  }

  if (rank === 1) {
    return (
      <Button onClick={onNext}>
        {t`C’est parti`}
        <ArrowRight aria-hidden />
      </Button>
    )
  }

  if (isReady || page === 'authorization') {
    return (
      <Button onClick={onNext}>
        {t`Continuer`}
        <ArrowRight aria-hidden />
      </Button>
    )
  }

  return (
    <Button onClick={onNext}>
      <Check aria-hidden />
      {t`C’est fait`}
    </Button>
  )
}
