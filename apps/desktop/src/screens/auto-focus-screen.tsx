import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { Tick } from '@/components/retro/tick'
import { IS_APPLE } from '@/constants/keyboard'
import { NOTIFICATION_LABELS } from '@/constants/notification'
import { MAP_NAMES } from '@/constants/world'
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

export const AutoFocusScreen = ({
  switches,
  isEnabled,
  wakesMinimized,
  run
}: AutoFocusScreenProps) => {
  const masterLabel = t`Activer l’AutoFocus`
  const minimizedLabel = t`Aller chercher les fenêtres réduites`

  return (
    <Screen
      title={i18n._(MAP_NAMES.autoFocus)}
      subtitle={t`Vous jouez plusieurs personnages à la fois. Multifus affiche celui dont c’est le tour, vous n’avez rien à cliquer.`}
    >
      <Panel>
        <FieldRow
          label={masterLabel}
          description={t`Le bon personnage s’affiche tout seul.`}
        >
          <Tick
            checked={isEnabled}
            aria-label={masterLabel}
            onCheckedChange={(enabled) => {
              run(setAutoFocusEnabled(enabled))
            }}
          />
        </FieldRow>
        <FieldRow
          label={minimizedLabel}
          description={
            IS_APPLE
              ? t`Même un personnage rangé dans le Dock revient devant vous.`
              : t`Même un personnage rangé dans la barre des tâches revient devant vous.`
          }
        >
          <Tick
            checked={wakesMinimized}
            aria-label={minimizedLabel}
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
        <PanelHeader
          title={t`Quand Multifus change de fenêtre`}
          description={t`À ces moments, le personnage concerné passe devant. Un personnage exclu dans les Personnages ne bouge pas.`}
        />
        {switches.map((entry) => {
          const words = NOTIFICATION_LABELS[entry.kind]
          const label = i18n._(words.label)

          return (
            <FieldRow
              key={entry.kind}
              label={label}
              description={i18n._(words.description)}
            >
              <Tick
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
