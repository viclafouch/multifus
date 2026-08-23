import { Link2Off } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { unpairRelay } from '@/lib/multifus'

type BotPanelProps = Readonly<{
  isWorking: boolean
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The bot, second card and under the switch. No field, the token never comes
 * back out and there could not be one, see ADR 0009.
 */
export const BotPanel = ({ isWorking, run }: BotPanelProps) => {
  return (
    <Panel className="mb-3">
      <SectionRow
        title={strings.relay.botTitle}
        description={strings.relay.botBody}
      >
        <Button
          variant="secondary"
          size="sm"
          aria-busy={isWorking}
          onClick={() => {
            run(unpairRelay())
          }}
        >
          <Link2Off aria-hidden />
          {isWorking ? strings.relay.unpairing : strings.relay.unpair}
        </Button>
      </SectionRow>
    </Panel>
  )
}
