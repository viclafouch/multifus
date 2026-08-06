import { PictureInPicture2, Radar } from 'lucide-react'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Switch } from '@/components/ui/switch'
import { NOTIFICATION_ICONS } from '@/constants/notification'
import { strings } from '@/constants/strings'
import {
  setAutoFocus,
  setAutoFocusEnabled,
  setWakesMinimized
} from '@/lib/multifus'

type AutoFocusScreenProps = Readonly<{
  switches: readonly AutoFocusSwitch[]
  isEnabled: boolean
  wakesMinimized: boolean
  run: (action: Promise<Snapshot>) => void
}>

/**
 * One master switch, then the seven, and only seven.
 *
 * They are global and there is deliberately no per-character grid here. Dracoon
 * puts one row of seven icons on every character, which is forty-two buttons for
 * six accounts plus the global-to-local synchronisation that comes with it;
 * perimetre.md drops the whole idea, and this screen is what replaces it.
 *
 * Two panels and not three. The first holds what is not a kind: whether the
 * AutoFocus runs at all, and whether it reaches into the Dock. The second holds
 * the seven kinds. Mixing the two would make « Fenêtres réduites » read like an
 * eighth event, which it is not.
 *
 * Suspended, the seven dim but stay live. Greying them out would be a lie, since
 * they are still what the AutoFocus comes back to, and the project's rule is to
 * explain a constraint rather than to block a click.
 *
 * No paragraph under the panels. Every caveat that used to sit there is a hint
 * on the row it belongs to: a note nobody reads is a note that does not exist,
 * and the reader who wonders about a row looks at that row.
 */
export const AutoFocusScreen = ({
  switches,
  isEnabled,
  wakesMinimized,
  run
}: AutoFocusScreenProps) => {
  return (
    <Screen
      title={strings.autoFocus.title}
      subtitle={strings.autoFocus.subtitle}
    >
      <Panel className="mb-3">
        <FieldRow
          label={strings.autoFocus.masterLabel}
          description={strings.autoFocus.masterDescription}
          icon={<Radar className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <Switch
            checked={isEnabled}
            aria-label={strings.autoFocus.masterLabel}
            onCheckedChange={(enabled) => {
              run(setAutoFocusEnabled(enabled))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.autoFocus.minimizedLabel}
          description={strings.autoFocus.minimizedDescription}
          icon={
            <PictureInPicture2
              className="size-glyph"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        >
          <Switch
            checked={wakesMinimized}
            aria-label={strings.autoFocus.minimizedLabel}
            onCheckedChange={(wakes) => {
              run(setWakesMinimized(wakes))
            }}
          />
        </FieldRow>
      </Panel>
      <Panel
        data-suspended={isEnabled ? undefined : ''}
        className="transition-suspend data-suspended:opacity-55"
      >
        {switches.map((entry) => {
          const { label, description } = strings.autoFocus.kinds[entry.kind]
          const Icon = NOTIFICATION_ICONS[entry.kind]

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
    </Screen>
  )
}
