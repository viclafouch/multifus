import { t } from '@lingui/core/macro'
import { Panel } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkLiveState, WalkStatus } from '@/@types/walk'
import { Tick } from '@/components/retro/tick'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { StateBadge } from '@/components/state-badge'
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
    <Panel data-walk={state} className={`${TONES} transition-row`}>
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <StateBadge>{lines.badge}</StateBadge>
          <p className="text-pretty text-aside text-khaki">{lines.body}</p>
        </div>
        <Tick
          checked={walk.enabled}
          aria-label={t`Déplacement rapide`}
          onCheckedChange={(enabled) => {
            run(setWalkEnabled(enabled))
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-band/25 px-3.5 py-2.5">
        <span className="text-aside text-khaki">{t`Raccourci`}</span>
        <ShortcutRecall accelerator={accelerator} />
      </div>
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
      body: t`Chaque clic gauche affiche le personnage suivant.`
    }
  }

  return {
    badge: t`Éteint`,
    body: t`Vos clics ne changent pas de personnage.`
  }
}
