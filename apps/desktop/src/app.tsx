import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { ConfigProblem } from '@/@types/system'
import { CheckNotice } from '@/components/check-notice'
import { ConfigNotice } from '@/components/config-notice'
import { JournalPanel } from '@/components/journal-panel'
import { KeyLabelsProvider } from '@/components/key-labels-provider'
import { NavRail } from '@/components/nav-rail'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useCurrentScreen } from '@/hooks/use-current-screen'
import { useEscape } from '@/hooks/use-escape'
import { useMultifus } from '@/hooks/use-multifus'
import { useTrayNavigation } from '@/hooks/use-tray-navigation'
import {
  closeRuneTable,
  dismissCheckNotice,
  dismissConfigProblem,
  revealQuarantinedConfig
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'
import { AboutScreen } from '@/screens/about'
import { AuthorizationScreen } from '@/screens/authorization-screen'
import { AutoFocusScreen } from '@/screens/auto-focus-screen'
import { CharactersScreen } from '@/screens/characters-screen'
import { OnboardingGuide } from '@/screens/onboarding/guide'
import { QuickRepliesScreen } from '@/screens/quick-replies'
import { RelayScreen } from '@/screens/relay'
import { RuneTableScreen } from '@/screens/rune-table'
import { SettingsScreen } from '@/screens/settings'
import { ShortcutsScreen } from '@/screens/shortcuts'
import { WalkScreen } from '@/screens/walk-screen'
import { WheelScreen } from '@/screens/wheel'

export const App = () => {
  const { snapshot, run } = useMultifus()
  const [screen, setScreen] = useCurrentScreen()

  useTrayNavigation(setScreen)

  useEscape(snapshot?.runeTable.previewing ?? false, () => {
    run(closeRuneTable())
  })

  if (snapshot === null) {
    return <Backdrop />
  }

  if (!snapshot.onboarding.done) {
    return (
      <KeyLabelsProvider labels={snapshot.keyboard}>
        <OnboardingGuide
          onboarding={snapshot.onboarding}
          characters={snapshot.characters}
          run={run}
        />
      </KeyLabelsProvider>
    )
  }

  return (
    <KeyLabelsProvider labels={snapshot.keyboard}>
      <TooltipProvider>
        <Backdrop />
        <div className="relative flex h-screen flex-col">
          <div className="flex min-h-0 flex-1">
            <NavRail
              current={screen}
              characters={snapshot.characters}
              authorization={snapshot.authorization}
              onboarding={snapshot.onboarding}
              version={snapshot.version}
              language={snapshot.language}
              onNavigate={setScreen}
            />
            <main className="flex min-h-0 flex-1 flex-col">
              {snapshot.config.problem === null ? null : (
                <ConfigNotice
                  problem={snapshot.config.problem}
                  quarantined={quarantinedPath(snapshot.config.problem)}
                  onReveal={() => {
                    revealQuarantinedConfig().catch(ignore)
                  }}
                  onDismiss={() => {
                    run(dismissConfigProblem())
                  }}
                />
              )}
              {snapshot.onboarding.hasNotice ? (
                <CheckNotice
                  onOpen={() => {
                    setScreen('settings')
                  }}
                  onDismiss={() => {
                    run(dismissCheckNotice())
                  }}
                />
              ) : null}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <CurrentScreen screen={screen} snapshot={snapshot} run={run} />
              </div>
            </main>
          </div>
          <JournalPanel snapshot={snapshot} />
        </div>
      </TooltipProvider>
    </KeyLabelsProvider>
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
        characters={snapshot.characters}
        quickReplies={snapshot.quickReplies}
        run={run}
      />
    )
  }

  if (screen === 'quickReplies') {
    return <QuickRepliesScreen quickReplies={snapshot.quickReplies} run={run} />
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

  if (screen === 'wheel') {
    return (
      <WheelScreen
        wheel={snapshot.wheel}
        shortcuts={snapshot.shortcuts}
        run={run}
      />
    )
  }

  if (screen === 'runeTable') {
    return (
      <RuneTableScreen
        runeTable={snapshot.runeTable}
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
        paintPortraits={snapshot.paintPortraits}
        ungroupTaskbar={snapshot.ungroupTaskbar}
        taskbarCombines={snapshot.taskbarCombines}
        onboarding={snapshot.onboarding}
        run={run}
      />
    )
  }

  if (screen === 'about') {
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

  return snapshot.authorization.granted ? (
    <CharactersScreen
      characters={snapshot.characters}
      paintPortraits={snapshot.paintPortraits}
      run={run}
    />
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
