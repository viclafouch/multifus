import { Activity, Maximize2, Power, Tag } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Switch } from '@/components/ui/switch'
import { UnavailableSwitch } from '@/components/unavailable-switch'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import {
  setMaximizeOnLaunch,
  setShortTitles,
  setStartAtLogin
} from '@/lib/multifus'

type SettingsScreenProps = Readonly<{
  startAtLogin: boolean
  maximizeOnLaunch: boolean
  shortTitles: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const SettingsScreen = ({
  startAtLogin,
  maximizeOnLaunch,
  shortTitles,
  run
}: SettingsScreenProps) => {
  return (
    <Screen title={strings.settings.title} subtitle={strings.settings.subtitle}>
      <Panel>
        <FieldRow
          label={strings.settings.startupLabel}
          description={strings.settings.startupDescription}
          icon={<Power className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <Switch
            checked={startAtLogin}
            aria-label={strings.settings.startupLabel}
            onCheckedChange={(checked) => {
              run(setStartAtLogin(checked))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.settings.maximizeLabel}
          description={strings.settings.maximizeDescription}
          icon={
            <Maximize2 className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <Switch
            checked={maximizeOnLaunch}
            aria-label={strings.settings.maximizeLabel}
            onCheckedChange={(checked) => {
              run(setMaximizeOnLaunch(checked))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.settings.shortTitlesLabel}
          description={strings.settings.shortTitlesDescription}
          icon={<Tag className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          {IS_APPLE ? (
            <UnavailableSwitch
              label={strings.settings.shortTitlesLabel}
              reason={strings.settings.shortTitlesWindowsOnly}
            />
          ) : (
            <Switch
              checked={shortTitles}
              aria-label={strings.settings.shortTitlesLabel}
              onCheckedChange={(short) => {
                run(setShortTitles(short))
              }}
            />
          )}
        </FieldRow>
        <FieldRow
          label={strings.settings.backgroundLabel}
          description={strings.settings.backgroundDescription}
          icon={
            <Activity className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <UnavailableSwitch
            checked
            label={strings.settings.backgroundLabel}
            reason={strings.settings.backgroundLocked}
          />
        </FieldRow>
      </Panel>
    </Screen>
  )
}
