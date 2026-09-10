import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { useOpenHelp } from '@/components/help-context'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { Button } from '@/components/retro/button'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { restartOnboarding } from '@/lib/multifus'

type HelpSectionProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const HelpSection = ({ run }: HelpSectionProps) => {
  const openHelp = useOpenHelp()

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
              openHelp('health')
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
              openHelp('questions')
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
    </section>
  )
}
