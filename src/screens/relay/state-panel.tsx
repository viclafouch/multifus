import type { RelayLiveState, RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { setRelayActive } from '@/lib/multifus'

const TONES =
  'data-[relay=active]:tone-live data-[relay=ready]:tone-idle data-[relay=incomplete]:tone-blocked'

type StatePanelProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

export const StatePanel = ({ relay, run }: StatePanelProps) => {
  const state = liveState(relay)
  const lines = strings.relay.state[state]
  const failure = relay.switch.kind === 'failed' ? relay.switch.reason : null

  return (
    <Panel data-relay={state} className={`${TONES} transition-row group mb-3`}>
      <section className="flex items-start gap-5 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="toned flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium tracking-micro uppercase">
            <span
              aria-hidden
              className="size-lamp shrink-0 rounded-full bg-current"
            />
            {lines.badge}
          </p>
          <h2 className="text-pretty text-row font-medium">
            {strings.relay.switchLabel}
          </h2>
          <p className="max-w-prose text-pretty text-note text-muted-foreground">
            {lines.body}
          </p>
        </div>
        <Switch
          checked={relay.active}
          aria-label={strings.relay.switchLabel}
          aria-busy={relay.switch.kind === 'starting'}
          aria-describedby={failure === null ? undefined : 'relay-switch'}
          className="mt-0.5"
          onCheckedChange={(active) => {
            run(setRelayActive(active))
          }}
        />
      </section>
      {failure === null ? null : (
        <p
          id="relay-switch"
          role="alert"
          className="border-t border-border/70 px-4 py-2.5 text-note text-destructive"
        >
          {strings.relay.failure[failure.reason](failure.detail)}
        </p>
      )}
    </Panel>
  )
}

const liveState = ({ active, ready }: RelayStatus): RelayLiveState => {
  if (active) {
    return 'active'
  }

  return ready ? 'ready' : 'incomplete'
}
