import React from 'react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import { matchIsDenied } from '@/helpers/authorization'
import { AboutScreen } from '@/screens/about'
import { AuthorizationScreen } from '@/screens/authorization-screen'
import { AutoFocusScreen } from '@/screens/auto-focus-screen'
import { CharactersScreen } from '@/screens/characters'
import { QuickTextsScreen } from '@/screens/quick-texts'
import { RelayScreen } from '@/screens/relay'
import { RuneTableScreen } from '@/screens/rune-table'
import { SettingsScreen } from '@/screens/settings'
import { ShortcutsScreen } from '@/screens/shortcuts'
import { WalkScreen } from '@/screens/walk-screen'

type CurrentMapProps = Readonly<{
  map: ScreenName
  snapshot: Snapshot
  run: (action: Promise<Snapshot>) => void
}>

export const CurrentMap = ({ map, snapshot, run }: CurrentMapProps) => {
  const maps = {
    characters: () => {
      return matchIsDenied(snapshot.authorization) ? (
        <AuthorizationScreen run={run} />
      ) : (
        <CharactersScreen
          characters={snapshot.characters}
          paintPortraits={snapshot.paintPortraits}
          wheel={snapshot.wheel}
          shortcuts={snapshot.shortcuts}
          run={run}
        />
      )
    },
    shortcuts: () => {
      return (
        <ShortcutsScreen
          shortcuts={snapshot.shortcuts}
          characters={snapshot.characters}
          quickTexts={snapshot.quickTexts}
          run={run}
        />
      )
    },
    quickTexts: () => {
      return <QuickTextsScreen quickTexts={snapshot.quickTexts} run={run} />
    },
    autoFocus: () => {
      return (
        <AutoFocusScreen
          switches={snapshot.autoFocus}
          isEnabled={snapshot.autoFocusEnabled}
          wakesMinimized={snapshot.wakesMinimized}
          run={run}
        />
      )
    },
    walk: () => {
      return (
        <WalkScreen
          walk={snapshot.walk}
          shortcuts={snapshot.shortcuts}
          run={run}
        />
      )
    },
    runeTable: () => {
      return (
        <RuneTableScreen
          runeTable={snapshot.runeTable}
          shortcuts={snapshot.shortcuts}
          run={run}
        />
      )
    },
    relay: () => {
      return (
        <RelayScreen
          relay={snapshot.relay}
          characters={snapshot.characters}
          run={run}
        />
      )
    },
    settings: () => {
      return (
        <SettingsScreen
          startAtLogin={snapshot.startAtLogin}
          maximizeOnLaunch={snapshot.maximizeOnLaunch}
          shortTitles={snapshot.shortTitles}
          paintPortraits={snapshot.paintPortraits}
          ungroupTaskbar={snapshot.ungroupTaskbar}
          taskbarCombines={snapshot.taskbarCombines}
          shareStats={snapshot.shareStats}
          run={run}
        />
      )
    },
    about: () => {
      return (
        <AboutScreen
          version={snapshot.version}
          system={snapshot.system}
          config={snapshot.config}
          update={snapshot.update}
          run={run}
        />
      )
    }
  } as const satisfies Record<ScreenName, () => React.JSX.Element>

  return maps[map]()
}
