import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Coins,
  Flag,
  Hammer,
  MessageSquare,
  Swords,
  Users
} from 'lucide-react'
import { FieldRow, Note, Panel, Screen } from '@/components/screen'
import { Switch } from '@/components/ui/switch'
import type {
  AutoFocusSwitch,
  NotificationKind,
  Snapshot
} from '@/lib/multifus'
import { setAutoFocus } from '@/lib/multifus'
import { strings } from '@/lib/strings'

/** One glyph per recognised event, so the seven rows can be told apart at speed. */
const ICONS = {
  combat: Swords,
  trade: ArrowLeftRight,
  group: Users,
  private_message: MessageSquare,
  challenge: Flag,
  craft: Hammer,
  perceptor: Coins
} as const satisfies Record<NotificationKind, LucideIcon>

type AutoFocusScreenProps = Readonly<{
  switches: readonly AutoFocusSwitch[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The seven switches, and only seven.
 *
 * They are global and there is deliberately no per-character grid here. Dracoon
 * puts one row of seven icons on every character, which is forty-two buttons for
 * six accounts plus the global-to-local synchronisation that comes with it;
 * perimetre.md drops the whole idea, and this screen is what replaces it.
 */
export const AutoFocusScreen = ({ switches, run }: AutoFocusScreenProps) => {
  return (
    <Screen
      title={strings.autoFocus.title}
      subtitle={strings.autoFocus.subtitle}
    >
      <Panel>
        {switches.map((entry) => {
          const { label, description } = strings.autoFocus.kinds[entry.kind]
          const Icon = ICONS[entry.kind]

          return (
            <FieldRow
              key={entry.kind}
              label={label}
              description={description}
              icon={
                <Icon className="size-glyph" strokeWidth={1.75} aria-hidden />
              }
            >
              <Switch
                checked={entry.enabled}
                aria-label={label}
                onCheckedChange={(enabled) => {
                  run(setAutoFocus(entry.kind, enabled))
                }}
              />
            </FieldRow>
          )
        })}
      </Panel>
      <Note>{strings.autoFocus.stillApplies}</Note>
      <Note>{strings.autoFocus.bannerWarning}</Note>
    </Screen>
  )
}
