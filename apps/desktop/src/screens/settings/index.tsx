import {
  Activity,
  Maximize2,
  Power,
  Rows3,
  SquareUserRound,
  Type
} from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Switch } from '@/components/ui/switch'
import { UnavailableSwitch } from '@/components/unavailable-switch'
import { WindowsSwitch } from '@/components/windows-switch'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import { useClients } from '@/hooks/use-clients'
import {
  setMaximizeOnLaunch,
  setPaintPortraits,
  setShortTitles,
  setStartAtLogin,
  setUngroupTaskbar
} from '@/lib/multifus'
import { ClientsPanel } from '@/screens/settings/clients-panel'

type SettingsScreenProps = Readonly<{
  startAtLogin: boolean
  maximizeOnLaunch: boolean
  shortTitles: boolean
  paintPortraits: boolean
  ungroupTaskbar: boolean
  taskbarCombines: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const SettingsScreen = ({
  startAtLogin,
  maximizeOnLaunch,
  shortTitles,
  paintPortraits,
  ungroupTaskbar,
  taskbarCombines,
  run
}: SettingsScreenProps) => {
  const isAlreadyUngrouped = !IS_APPLE && !taskbarCombines
  const clients = useClients()

  return (
    <Screen title={strings.settings.title} subtitle={strings.settings.subtitle}>
      {IS_APPLE ? <Note className="mb-4">{strings.maximize.note}</Note> : null}
      {clients === null ? null : <ClientsPanel clients={clients} run={run} />}
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
          icon={<Type className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <WindowsSwitch
            checked={shortTitles}
            label={strings.settings.shortTitlesLabel}
            onCheckedChange={(short) => {
              run(setShortTitles(short))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.settings.portraitLabel}
          description={strings.settings.portraitDescription}
          icon={
            <SquareUserRound
              className="size-glyph"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        >
          <WindowsSwitch
            checked={paintPortraits}
            label={strings.settings.portraitLabel}
            onCheckedChange={(paint) => {
              run(setPaintPortraits(paint))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.settings.ungroupLabel}
          description={
            isAlreadyUngrouped
              ? strings.settings.ungroupAlready
              : strings.settings.ungroupDescription
          }
          icon={<Rows3 className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <WindowsSwitch
            checked={ungroupTaskbar}
            label={strings.settings.ungroupLabel}
            onCheckedChange={(ungroup) => {
              run(setUngroupTaskbar(ungroup))
            }}
          />
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
