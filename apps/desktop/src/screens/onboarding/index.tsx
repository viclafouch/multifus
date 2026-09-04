import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionTitle } from '@/components/layout/section-title'
import { Button } from '@/components/ui/button'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { restartOnboarding } from '@/lib/multifus'
import { StepRow } from '@/screens/onboarding/step-row'

type OnboardingSectionProps = Readonly<{
  onboarding: Onboarding
  run: (action: Promise<Snapshot>) => void
}>

export const OnboardingSection = ({
  onboarding,
  run
}: OnboardingSectionProps) => {
  return (
    <section id={ONBOARDING_ANCHOR} className="scroll-mt-4">
      <SectionTitle
        title={t`Prise en main`}
        subtitle={t`Les réglages à faire une fois. Multifus vous prévient s’il en voit un qui bloque.`}
      />
      <Panel>
        <ol className="divide-y divide-border/60">
          {onboarding.steps.map((status, rank) => {
            return (
              <li key={status.step}>
                <StepRow status={status} rank={rank + 1} />
              </li>
            )
          })}
        </ol>
        <div className="flex min-h-row items-center gap-3 border-t border-border/60 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-row text-muted-foreground">
            {t`Revoir la prise en main`}
          </p>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              run(restartOnboarding())
            }}
          >
            {t`Revoir`}
          </Button>
        </div>
      </Panel>
    </section>
  )
}
