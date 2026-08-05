import React from 'react'
import { ConfigNotice } from '@/components/config-notice'
import { JournalPanel } from '@/components/journal-panel'
import { NavRail } from '@/components/nav-rail'
import { useMultifus } from '@/hooks/use-multifus'
import { useTrayNavigation } from '@/hooks/use-tray-navigation'
import type { ConfigProblem, ScreenName, Snapshot } from '@/lib/multifus'
import { dismissConfigProblem, revealQuarantinedConfig } from '@/lib/multifus'
import { AboutScreen } from '@/screens/about-screen'
import { AuthorizationScreen } from '@/screens/authorization-screen'
import { AutoFocusScreen } from '@/screens/auto-focus-screen'
import { CharactersScreen } from '@/screens/characters-screen'
import { ShortcutsScreen } from '@/screens/shortcuts-screen'

/**
 * The window: a rail on the left, a screen in the middle, a journal underneath.
 *
 * It is meant to be a board one consults, not a panel one visits. Everything
 * that says whether multifus is working is visible without a click; the settings
 * are three screens away because they are set once and then forgotten.
 */
export const App = () => {
  const { snapshot, run } = useMultifus()
  const [screen, setScreen] = React.useState<ScreenName>('characters')

  useTrayNavigation(setScreen)

  if (snapshot === null) {
    return <Backdrop />
  }

  return (
    <>
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
    </>
  )
}

type CurrentScreenProps = Readonly<{
  screen: ScreenName
  snapshot: Snapshot
  run: (action: Promise<Snapshot>) => void
}>

const CurrentScreen = ({ screen, snapshot, run }: CurrentScreenProps) => {
  if (screen === 'shortcuts') {
    return <ShortcutsScreen shortcuts={snapshot.shortcuts} run={run} />
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

  if (screen === 'about') {
    return (
      <AboutScreen
        version={snapshot.version}
        config={snapshot.config}
        startAtLogin={snapshot.startAtLogin}
        update={snapshot.update}
        run={run}
      />
    )
  }

  // The roster is the only screen that needs the system's permission, so it is
  // the only one the explanation replaces. The other three are set up while
  // macOS thinks about it.
  return snapshot.authorization.granted ? (
    <CharactersScreen characters={snapshot.characters} run={run} />
  ) : (
    <AuthorizationScreen run={run} />
  )
}

/**
 * Atmosphere, and nothing else: one warm light from the top left and a film of
 * grain over the whole window. Both sit behind everything and take no clicks.
 */
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

/** The Rust side journals what the system refused to open. Nothing to add. */
const ignoreOpenFailure = () => {}
