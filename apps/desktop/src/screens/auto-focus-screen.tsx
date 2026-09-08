import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { Snapshot } from '@/@types/snapshot'
import autoFocusLoop from '@/assets/ankama/auto-focus-loop.mp4'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { LoopButton } from '@/components/loop-button'
import { LoopDialog } from '@/components/loop-dialog'
import { Tick } from '@/components/retro/tick'
import { IS_APPLE } from '@/constants/keyboard'
import { NOTIFICATION_LABELS } from '@/constants/notification'
import { MAP_NAMES } from '@/constants/world'
import { useLoopOnce } from '@/hooks/use-loop-once'
import {
  setAutoFocus,
  setAutoFocusEnabled,
  setWakesMinimized
} from '@/lib/multifus'

type AutoFocusScreenProps = Readonly<{
  switches: readonly AutoFocusSwitch[]
  isEnabled: boolean
  wakesMinimized: boolean
  isLoopSeen: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const AutoFocusScreen = ({
  switches,
  isEnabled,
  wakesMinimized,
  isLoopSeen,
  run
}: AutoFocusScreenProps) => {
  const loop = useLoopOnce({ loop: 'autoFocus', isSeen: isLoopSeen, run })
  const masterLabel = t`Activer l’AutoFocus`
  const minimizedLabel = t`Aller chercher les fenêtres réduites`

  return (
    <Screen
      title={i18n._(MAP_NAMES.autoFocus)}
      subtitle={t`Un combat, un échange, un message privé : Multifus affiche le personnage concerné, tout seul.`}
      action={<LoopButton onOpen={loop.handleOpen} />}
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
      <LoopDialog
        title={i18n._(MAP_NAMES.autoFocus)}
        description={t`Allumez, et laissez le jeu vous appeler : dès qu’un personnage reçoit un combat, un échange ou un défi, sa fenêtre passe devant sans que vous touchiez à rien.`}
        caption={t`Un défi arrive sur un autre personnage : sa fenêtre passe devant toute seule, la demande déjà à l’écran.`}
        source={autoFocusLoop}
        isOpen={loop.isOpen}
        onOpenChange={loop.handleOpenChange}
      />
    </Screen>
  )
}
