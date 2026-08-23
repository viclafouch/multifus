import type { RelayLiveState, RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { setRelayActive } from '@/lib/multifus'

/** One class per state, so the panel names its state once and everything under
 * it reads the tone from there. */
const TONES =
  'data-[relay=active]:tone-live data-[relay=ready]:tone-idle data-[relay=incomplete]:tone-blocked'

type StatePanelProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The switch, and the state it is in. First card of the screen, because it is
 * the only question somebody about to leave the desk is actually asking.
 */
export const StatePanel = ({ relay, run }: StatePanelProps) => {
  const state = liveState(relay)
  const lines = strings.relay.state[state]
  const failure = relay.switch.kind === 'failed' ? relay.switch.reason : null

  return (
    <Panel
      data-relay={state}
      // `data-relay:` on the tint and not a bare class: `Panel` brings its own
      // `bg-card` and `border-border`, and only the attribute outweighs them.
      className={`${TONES} transition-row group mb-3 data-relay:panel-toned`}
    >
      <section className="flex items-start gap-5 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="toned flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium tracking-micro uppercase">
            <span
              aria-hidden
              className="size-lamp shrink-0 rounded-full bg-current group-data-[relay=active]:tone-breath"
            />
            {lines.badge}
          </p>
          <h2 className="text-pretty text-row font-medium">{lines.title}</h2>
          <p className="max-w-prose text-pretty text-note text-muted-foreground">
            {lines.body}
          </p>
        </div>
        {/* Never disabled, even with nobody ticked: the badge and the line above
            already say why it will not take, which a grey switch cannot. */}
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
      {/* The card above says « à l'arrêt, tout est prêt », which a refused
          keychain turns into a lie. This is the only place that can deny it. */}
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

/** Three states and not two: a relay that cannot start and one that is merely
 * stopped are repaired in two different places. */
const liveState = ({ active, ready }: RelayStatus): RelayLiveState => {
  if (active) {
    return 'active'
  }

  return ready ? 'ready' : 'incomplete'
}
