import React from 'react'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { ConfigProblem } from '@/@types/system'
import { ConfigNotice } from '@/components/config-notice'
import { JournalPanel } from '@/components/journal-panel'
import { NavRail } from '@/components/nav-rail'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useMultifus } from '@/hooks/use-multifus'
import { useTrayNavigation } from '@/hooks/use-tray-navigation'
import { dismissConfigProblem, revealQuarantinedConfig } from '@/lib/multifus'
import { AboutScreen } from '@/screens/about-screen'
import { AuthorizationScreen } from '@/screens/authorization-screen'
import { AutoFocusScreen } from '@/screens/auto-focus-screen'
import { CharactersScreen } from '@/screens/characters-screen'
import { RelayScreen } from '@/screens/relay'
import { SettingsScreen } from '@/screens/settings-screen'
import { ShortcutsScreen } from '@/screens/shortcuts'
import { WalkScreen } from '@/screens/walk-screen'

export const App = () => {
  const { snapshot, run } = useMultifus()
  const [screen, setScreen] = React.useState<ScreenName>('characters')

  useTrayNavigation(setScreen)

  if (snapshot === null) {
    return <Backdrop />
  }

  return (
    <TooltipProvider>
      <Backdrop />
      <div className="relative flex h-screen flex-col">
        <div className="flex min-h-0 flex-1">
          <NavRail
            current={screen}
            characters={snapshot.characters}
            authorization={snapshot.authorization}
            version={snapshot.version}
            onNavigate={setScreen}
          />
          <main className="flex min-h-0 flex-1 flex-col">
            {snapshot.config.problem === null ? null : (
              <ConfigNotice
                problem={snapshot.config.problem}
                quarantined={quarantinedPath(snapshot.config.problem)}
                onReveal={() => {
                  revealQuarantinedConfig().catch(ignoreOpenFailure)
                }}
                onDismiss={() => {
                  run(dismissConfigProblem())
                }}
              />
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CurrentScreen screen={screen} snapshot={snapshot} run={run} />
            </div>
          </main>
        </div>
        <JournalPanel snapshot={snapshot} />
      </div>
    </TooltipProvider>
  )
}

type CurrentScreenProps = Readonly<{
  screen: ScreenName
  snapshot: Snapshot
  run: (action: Promise<Snapshot>) => void
}>

const CurrentScreen = ({ screen, snapshot, run }: CurrentScreenProps) => {
  if (screen === 'shortcuts') {
    return (
      <ShortcutsScreen
        shortcuts={snapshot.shortcuts}
        quickReplies={snapshot.quickReplies}
        run={run}
      />
    )
  }

  if (screen === 'autoFocus') {
    return (
      <AutoFocusScreen
        switches={snapshot.autoFocus}
        isEnabled={snapshot.autoFocusEnabled}
        wakesMinimized={snapshot.wakesMinimized}
        run={run}
      />
    )
  }

  if (screen === 'walk') {
    return (
      <WalkScreen
        walk={snapshot.walk}
        shortcuts={snapshot.shortcuts}
        run={run}
      />
    )
  }

  if (screen === 'relay') {
    return (
      <RelayScreen
        relay={snapshot.relay}
        characters={snapshot.characters}
        run={run}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        startAtLogin={snapshot.startAtLogin}
        maximizeOnLaunch={snapshot.maximizeOnLaunch}
        shortTitles={snapshot.shortTitles}
        ungroupTaskbar={snapshot.ungroupTaskbar}
        taskbarCombines={snapshot.taskbarCombines}
        run={run}
      />
    )
  }

  if (screen === 'about') {
    return (
      <AboutScreen
        version={snapshot.version}
        config={snapshot.config}
        update={snapshot.update}
        run={run}
      />
    )
  }

  return snapshot.authorization.granted ? (
    <CharactersScreen characters={snapshot.characters} run={run} />
  ) : (
    <AuthorizationScreen run={run} />
  )
}

const Backdrop = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="warm-light absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  )
}

const quarantinedPath = (problem: ConfigProblem) => {
  return problem.kind === 'malformed' ? problem.quarantined : null
}

const ignoreOpenFailure = () => {}
