import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Page } from '@/@types/onboarding'
import { Button } from '@/components/retro/button'
import { PAGE_SHOTS, SYSTEM_PAGES } from '@/constants/onboarding'
import { leadOf, nextLabel } from '@/helpers/onboarding'
import { OpenButton } from '@/screens/onboarding/open-button'
import { ShotWindow } from '@/screens/onboarding/shot-window'

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
  const lead = leadOf(page, isReady)
  const label = nextLabel({ page, rank, count, isReady })

  return (
    <div className="flex flex-col items-center gap-4">
      {lead.kind === 'ask' ? (
        <Button size="lead" onClick={onAsk}>
          {t`Autoriser Multifus`}
        </Button>
      ) : null}
      {lead.kind === 'open' ? (
        <OpenButton page={lead.systemPage} variant="leaf" size="lead" />
      ) : null}
      {lead.kind === 'show' ? (
        <ShotWindow
          source={lead.shot.full}
          alt={i18n._(lead.shot.alt)}
          variant="leaf"
          size="lead"
        />
      ) : null}
      {lead.kind === 'next' ? (
        <Button size="lead" variant="leaf" onClick={onNext}>
          {label}
        </Button>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {systemPage === null || lead.kind === 'open' ? null : (
          <OpenButton page={systemPage} variant="slate" size="default" />
        )}
        {shot === null || lead.kind === 'show' ? null : (
          <ShotWindow
            source={shot.full}
            alt={i18n._(shot.alt)}
            variant="slate"
            size="default"
          />
        )}
        {lead.kind === 'next' ? null : (
          <Button size="default" variant="slate" onClick={onNext}>
            {label}
          </Button>
        )}
      </div>
    </div>
  )
}
