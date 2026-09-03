import { Keyboard } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkLiveState, WalkStatus } from '@/@types/walk'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { StateBadge } from '@/components/state-badge'
import { Switch } from '@/components/ui/switch'
import { setWalkEnabled } from '@/lib/multifus'

const TONES = 'data-[walk=on]:tone-live data-[walk=off]:tone-idle'

type StatePanelProps = Readonly<{
  walk: WalkStatus
  accelerator: string | null
  run: (action: Promise<Snapshot>) => void
}>

export const StatePanel = ({ walk, accelerator, run }: StatePanelProps) => {
  const state = liveState(walk)
  const lines = stateLines(state)

  return (
    <Panel data-walk={state} className={`${TONES} transition-row mb-3`}>
      <section className="flex items-start gap-5 border-b border-border/70 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <StateBadge>{lines.badge}</StateBadge>
          <p className="max-w-prose text-pretty text-row">{lines.body}</p>
        </div>
        <Switch
          checked={walk.enabled}
          aria-label={t`Déplacement rapide`}
          className="mt-0.5"
          onCheckedChange={(enabled) => {
            run(setWalkEnabled(enabled))
          }}
        />
      </section>
      <FieldRow
        label={t`Raccourci`}
        description={t`Allume sans quitter le jeu.`}
        icon={
          <Keyboard className="size-glyph" strokeWidth={1.75} aria-hidden />
        }
      >
        <ShortcutRecall accelerator={accelerator} />
      </FieldRow>
    </Panel>
  )
}

const liveState = ({ enabled }: WalkStatus): WalkLiveState => {
  return enabled ? 'on' : 'off'
}

const stateLines = (state: WalkLiveState) => {
  if (state === 'on') {
    return {
      badge: t`Allumé`,
      body: t`Cliquez pour déplacer, la fenêtre suivante arrive toute seule.`
    }
  }

  return {
    badge: t`Éteint`,
    body: t`Vos clics vont au jeu, et à rien d’autre.`
  }
}
