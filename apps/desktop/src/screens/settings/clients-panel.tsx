import { t } from '@lingui/core/macro'
import type { Clients, Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { Button } from '@/components/retro/button'
import { StateBadge } from '@/components/state-badge'
import { clientsLines } from '@/helpers/wording'
import { maximizeAllClients } from '@/lib/multifus'

const TONES =
  'data-[clients=maximized]:tone-live data-[clients=small]:tone-idle data-[clients=none]:tone-idle data-[clients=unreadable]:tone-blocked'

type ClientsPanelProps = Readonly<{
  clients: Clients
  run: (action: Promise<Snapshot>) => void
}>

export const ClientsPanel = ({ clients, run }: ClientsPanelProps) => {
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
          <h2 className="text-tale font-medium">
            {t`La taille de vos fenêtres Dofus Retro`}
          </h2>
          <p className="max-w-tale text-pretty text-aside text-muted-foreground">
            {lines.body}
          </p>
        </div>
        <Button
          variant="slate"
          size="sm"
          className="shrink-0"
          onClick={handleMaximize}
        >
          {t`Agrandir les fenêtres`}
        </Button>
      </section>
    </Panel>
  )
}
