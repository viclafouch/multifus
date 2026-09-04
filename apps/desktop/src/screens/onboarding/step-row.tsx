import { i18n } from '@lingui/core'
import type { StepStatus } from '@/@types/onboarding'
import { SystemPageButton } from '@/components/system-page-button'
import { PAGE_SHOTS, SYSTEM_PAGES } from '@/constants/onboarding'
import { checkLine, pageTitle, pageWay } from '@/helpers/onboarding'
import { SettingWay } from '@/screens/onboarding/setting-way'
import { ShotDialog } from '@/screens/onboarding/shot-dialog'
import { StepDisc } from '@/screens/onboarding/step-disc'

type StepRowProps = Readonly<{
  status: StepStatus
  rank: number
}>

export const StepRow = ({ status, rank }: StepRowProps) => {
  const { step, check } = status
  const systemPage = SYSTEM_PAGES[step]
  const shot = PAGE_SHOTS[step]
  const way = pageWay(step)

  return (
    <div className="flex min-h-row items-center gap-3 px-4 py-2.5">
      <StepDisc rank={rank} check={check} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="truncate text-row font-medium">{pageTitle(step)}</h2>
        {check === 'blocked' ? (
          <p className="tone-blocked toned-ink truncate text-note">
            {checkLine(step, check)}
          </p>
        ) : (
          <SettingWay way={way} />
        )}
      </div>
      {shot === null ? null : (
        <ShotDialog source={shot.full} alt={i18n._(shot.alt)} size="xs" />
      )}
      {systemPage === null ? null : (
        <SystemPageButton page={systemPage} variant="ghost" size="xs" />
      )}
    </div>
  )
}
