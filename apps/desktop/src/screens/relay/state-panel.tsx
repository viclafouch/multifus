import { t } from '@lingui/core/macro'
import type { RelayLiveState, RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { StateBadge } from '@/components/state-badge'
import { Switch } from '@/components/ui/switch'
import { relayFailureLine } from '@/helpers/wording'
import { setRelayActive } from '@/lib/multifus'

const TONES =
  'data-[relay=active]:tone-live data-[relay=ready]:tone-idle data-[relay=incomplete]:tone-blocked'

type StatePanelProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

export const StatePanel = ({ relay, run }: StatePanelProps) => {
  const switchLabel = t`Recevoir mes messages privés sur mon téléphone`

  const state = liveState(relay)
  const lines = stateLines(state)
  const failure = relay.switch.kind === 'failed' ? relay.switch.reason : null

  return (
    <Panel data-relay={state} className={`${TONES} transition-row group mb-3`}>
      <section className="flex items-start gap-5 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <StateBadge>{lines.badge}</StateBadge>
          <h2 className="text-pretty text-row font-medium">{switchLabel}</h2>
          <p className="max-w-prose text-pretty text-note text-muted-foreground">
            {lines.body}
          </p>
        </div>
        <Switch
          checked={relay.active}
          aria-label={switchLabel}
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
          {relayFailureLine(failure)}
        </p>
      )}
    </Panel>
  )
}

const stateLines = (state: RelayLiveState) => {
  switch (state) {
    case 'active': {
      return {
        badge: t`En marche`,
        body: t`Vous ne raterez rien tant que Dofus Retro vous garde connecté. Un raccourci qui vous ramène sur une fenêtre coupe l’envoi, puisque vous voilà revenu.`
      }
    }
    case 'ready': {
      return {
        badge: t`À l’arrêt`,
        body: t`Tout est prêt. Mettez l’interrupteur en marche avant de vous lever, ici ou depuis l’icône de Multifus.`
      }
    }
    case 'incomplete': {
      return {
        badge: t`Aucun personnage connecté`,
        body: t`Multifus n’a personne à écouter. Cochez un personnage plus bas, ou connectez-en un dans Dofus Retro.`
      }
    }
    default: {
      return state satisfies never
    }
  }
}

const liveState = ({ active, ready }: RelayStatus): RelayLiveState => {
  if (active) {
    return 'active'
  }

  return ready ? 'ready' : 'incomplete'
}
