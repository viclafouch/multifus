import type { ConfigProblem } from '@/@types/system'
import { CheckNotice } from '@/components/check-notice'
import { ConfigNotice } from '@/components/config-notice'
import { JournalPanel } from '@/components/journal-panel'
import { KeyLabelsProvider } from '@/components/key-labels-provider'
import { Shade } from '@/components/layout/shade'
import { SceneCredit } from '@/components/retro/scene-credit'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Cartouche } from '@/components/world/cartouche'
import { MapFrame } from '@/components/world/map-frame'
import { WorldScene } from '@/components/world/world-scene'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { CLEARING } from '@/constants/world'
import { useCurrentMap } from '@/hooks/use-current-map'
import { useEscape } from '@/hooks/use-escape'
import { useMultifus } from '@/hooks/use-multifus'
import { useTrayNavigation } from '@/hooks/use-tray-navigation'
import { showAnchor } from '@/lib/anchor'
import {
  closeRuneTable,
  dismissCheckNotice,
  dismissConfigProblem,
  revealQuarantinedConfig
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'
import { ClearingScreen } from '@/screens/clearing'
import { CurrentMap } from '@/screens/current-map'
import { OnboardingGuide } from '@/screens/onboarding/guide'

export const App = () => {
  const { snapshot, run } = useMultifus()
  const [map, setMap] = useCurrentMap()

  useTrayNavigation(setMap)

  const isPreviewing = snapshot?.runeTable.previewing ?? false

  useEscape(isPreviewing, () => {
    run(closeRuneTable())
  })

  useEscape(!isPreviewing && map !== CLEARING, () => {
    setMap(CLEARING)
  })

  if (snapshot === null) {
    return <div aria-hidden className="grove fixed inset-0 -z-10" />
  }

  if (!snapshot.onboarding.done) {
    return (
      <KeyLabelsProvider labels={snapshot.keyboard}>
        <OnboardingGuide
          onboarding={snapshot.onboarding}
          characters={snapshot.characters}
          language={snapshot.language}
          run={run}
        />
      </KeyLabelsProvider>
    )
  }

  return (
    <KeyLabelsProvider labels={snapshot.keyboard}>
      <TooltipProvider>
        <div className="relative flex h-screen flex-col overflow-hidden pb-ledger font-plain text-khaki">
          <WorldScene map={map} />
          <Shade edge="top" />
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
                showAnchor(ONBOARDING_ANCHOR, () => {
                  setMap('settings')
                })
              }}
              onDismiss={() => {
                run(dismissCheckNotice())
              }}
            />
          ) : null}
          <Cartouche version={snapshot.version} language={snapshot.language} />
          {map === CLEARING ? (
            <ClearingScreen
              characters={snapshot.characters}
              authorization={snapshot.authorization}
              onboarding={snapshot.onboarding}
              paintPortraits={snapshot.paintPortraits}
              onGo={setMap}
              run={run}
            />
          ) : (
            <MapFrame
              map={map}
              onLeave={() => {
                setMap(CLEARING)
              }}
            >
              <CurrentMap map={map} snapshot={snapshot} run={run} />
            </MapFrame>
          )}
          <Shade edge="bottom" />
          <footer className="pointer-events-none absolute inset-x-0 bottom-ledger z-20 flex h-hem items-end px-4 pb-2">
            <SceneCredit />
          </footer>
          <JournalPanel snapshot={snapshot} />
        </div>
      </TooltipProvider>
    </KeyLabelsProvider>
  )
}

const quarantinedPath = (problem: ConfigProblem) => {
  return problem.kind === 'malformed' ? problem.quarantined : null
}
