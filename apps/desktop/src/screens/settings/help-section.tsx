import React from 'react'
import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Snapshot } from '@/@types/snapshot'
import { HealthDialog } from '@/components/health-dialog'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { QuestionsDialog } from '@/components/questions-dialog'
import { Button } from '@/components/retro/button'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { restartOnboarding } from '@/lib/multifus'

type HelpSectionProps = Readonly<{
  onboarding: Onboarding
  isAutoFocusEnabled: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const HelpSection = ({
  onboarding,
  isAutoFocusEnabled,
  run
}: HelpSectionProps) => {
  const [isCheckOpen, setIsCheckOpen] = React.useState(false)
  const [areQuestionsOpen, setAreQuestionsOpen] = React.useState(false)

  return (
    <section id={ONBOARDING_ANCHOR} className="scroll-mt-24">
      <Panel>
        <FieldRow
          label={t`Est-ce que tout marche ?`}
          description={t`Multifus relit les réglages dont l’AutoFocus dépend et vous dit ce qu’il trouve.`}
        >
          <Button
            variant="slate"
            size="sm"
            onClick={() => {
              setIsCheckOpen(true)
            }}
          >
            {t`Vérifier`}
          </Button>
        </FieldRow>
        <FieldRow
          label={t`Questions fréquentes`}
          description={t`Une bannière de trop, un raccourci muet, une fenêtre qui ne s’agrandit pas : ce qu’il faut cocher, et où.`}
        >
          <Button
            variant="slate"
            size="sm"
            onClick={() => {
              setAreQuestionsOpen(true)
            }}
          >
            {t`Ouvrir`}
          </Button>
        </FieldRow>
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
      <HealthDialog
        isOpen={isCheckOpen}
        onOpenChange={setIsCheckOpen}
        onboarding={onboarding}
        isAutoFocusEnabled={isAutoFocusEnabled}
        run={run}
      />
      <QuestionsDialog
        isOpen={areQuestionsOpen}
        onOpenChange={setAreQuestionsOpen}
        run={run}
      />
    </section>
  )
}
