import { Maximize } from 'lucide-react'
import type { Clients, Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { StateBadge } from '@/components/state-badge'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { clientsLines } from '@/helpers/wording'
import { maximizeAllClients } from '@/lib/multifus'

const TONES =
  'data-[clients=maximized]:tone-live data-[clients=small]:tone-idle data-[clients=none]:tone-idle data-[clients=unreadable]:tone-blocked'

type ClientsPanelProps = Readonly<{
  clients: Clients
  run: (action: Promise<Snapshot>) => void
}>

export const ClientsPanel = ({ clients, run }: ClientsPanelProps) => {
  const words = strings.settings.clients
  const lines = clientsLines(clients)

  const handleMaximize = () => {
    run(maximizeAllClients())
  }

  return (
    <Panel
      data-clients={lines.state}
      className={`${TONES} transition-row mb-4`}
    >
      <section className="flex items-center gap-5 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <StateBadge>{lines.badge}</StateBadge>
          <h2 className="text-row font-medium">{words.title}</h2>
          <p className="max-w-prose text-pretty text-note text-muted-foreground">
            {lines.body}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={handleMaximize}
        >
          <Maximize aria-hidden />
          {words.action}
        </Button>
      </section>
    </Panel>
  )
}
