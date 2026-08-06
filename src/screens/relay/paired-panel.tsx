import { Link2Off } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { unpairRelay } from '@/lib/multifus'

type PairedPanelProps = Readonly<{
  isWorking: boolean
  run: (action: Promise<Snapshot>) => void
}>

/**
 * What is left once the pairing has gone through: a state and one button.
 * No field: multifus never reads the token back out, see ADR 0009.
 */
export const PairedPanel = ({ isWorking, run }: PairedPanelProps) => {
  return (
    <Panel className="mb-3">
      <SectionRow
        title={strings.relay.pairedTitle}
        description={strings.relay.pairedBody}
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
