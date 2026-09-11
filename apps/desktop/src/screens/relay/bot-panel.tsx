import { t } from '@lingui/core/macro'
import { Button, Panel } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import { SectionRow } from '@/components/layout/section-row'
import { unpairRelay } from '@/lib/multifus'

type BotPanelProps = Readonly<{
  isWorking: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const BotPanel = ({ isWorking, run }: BotPanelProps) => {
  return (
    <Panel>
      <SectionRow
        title={t`Robot Telegram relié`}
        description={t`C’est lui qui vous écrit dans Telegram. Le retirer coupe tout, et il faudra refaire les cinq étapes.`}
      >
        <Button
          variant="slate"
          size="sm"
          aria-busy={isWorking}
          onClick={() => {
            run(unpairRelay())
          }}
        >
          {isWorking ? t`Retrait…` : t`Retirer ce robot`}
        </Button>
      </SectionRow>
    </Panel>
  )
}
