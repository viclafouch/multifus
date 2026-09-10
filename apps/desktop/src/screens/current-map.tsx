import React from 'react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import { AboutScreen } from '@/screens/about'
import { AuthorizationScreen } from '@/screens/authorization-screen'
import { AutoFocusScreen } from '@/screens/auto-focus-screen'
import { CharactersScreen } from '@/screens/characters'
import { QuickRepliesScreen } from '@/screens/quick-replies'
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
      return snapshot.authorization.granted ? (
        <CharactersScreen
          characters={snapshot.characters}
          paintPortraits={snapshot.paintPortraits}
          wheel={snapshot.wheel}
          shortcuts={snapshot.shortcuts}
          run={run}
        />
      ) : (
        <AuthorizationScreen run={run} />
      )
    },
    shortcuts: () => {
      return (
        <ShortcutsScreen
          shortcuts={snapshot.shortcuts}
          characters={snapshot.characters}
          quickReplies={snapshot.quickReplies}
          run={run}
        />
      )
    },
    quickReplies: () => {
      return (
        <QuickRepliesScreen quickReplies={snapshot.quickReplies} run={run} />
      )
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
          onboarding={snapshot.onboarding}
          isAutoFocusEnabled={snapshot.autoFocusEnabled}
          startAtLogin={snapshot.startAtLogin}
          maximizeOnLaunch={snapshot.maximizeOnLaunch}
          shortTitles={snapshot.shortTitles}
          paintPortraits={snapshot.paintPortraits}
          ungroupTaskbar={snapshot.ungroupTaskbar}
          taskbarCombines={snapshot.taskbarCombines}
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
