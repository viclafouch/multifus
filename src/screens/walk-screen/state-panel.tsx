import { Keyboard } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkLiveState, WalkStatus } from '@/@types/walk'
import { KeyCap } from '@/components/key-cap'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { StateBadge } from '@/components/state-badge'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { acceleratorParts } from '@/helpers/accelerator'
import { setWalkEnabled } from '@/lib/multifus'

const TONES = 'data-[walk=on]:tone-live data-[walk=off]:tone-idle'

type StatePanelProps = Readonly<{
  walk: WalkStatus
  accelerator: string | null
  run: (action: Promise<Snapshot>) => void
}>

export const StatePanel = ({ walk, accelerator, run }: StatePanelProps) => {
  const state = liveState(walk)
  const lines = strings.walk.state[state]

  return (
    <Panel data-walk={state} className={`${TONES} transition-row mb-3`}>
      <section className="flex items-start gap-5 border-b border-border/70 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <StateBadge>{lines.badge}</StateBadge>
          <p className="max-w-prose text-pretty text-row">{lines.body}</p>
        </div>
        <Switch
          checked={walk.enabled}
          aria-label={strings.walk.switchLabel}
          className="mt-0.5"
          onCheckedChange={(enabled) => {
            run(setWalkEnabled(enabled))
          }}
        />
      </section>
      <FieldRow
        label={strings.walk.shortcutLabel}
        description={strings.walk.shortcutDescription}
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

type ShortcutRecallProps = Readonly<{
  accelerator: string | null
}>

const ShortcutRecall = ({ accelerator }: ShortcutRecallProps) => {
  if (accelerator === null) {
    return (
      <span className="text-note text-muted-foreground">
        {strings.walk.shortcutEmpty}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1">
      {acceleratorParts(accelerator).map((token) => {
        return <KeyCap key={token} token={token} />
      })}
    </span>
  )
}
