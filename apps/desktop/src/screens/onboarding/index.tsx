import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { Button } from '@/components/retro/button'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { restartOnboarding } from '@/lib/multifus'

type OnboardingSectionProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const OnboardingSection = ({ run }: OnboardingSectionProps) => {
  return (
    <section id={ONBOARDING_ANCHOR} className="scroll-mt-24">
      <Panel>
        <FieldRow
          label={t`Revoir la mise en route`}
          description={t`Les réglages à faire une fois, repris un par un. Rien de ce qui est déjà en place ne s’annule.`}
        >
          <Button
            variant="slate"
            size="sm"
            onClick={() => {
              run(restartOnboarding())
            }}
          >
            {t`Revoir`}
          </Button>
        </FieldRow>
      </Panel>
    </section>
  )
}
