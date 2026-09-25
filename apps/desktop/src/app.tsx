import React from 'react'
import { Shade } from '@multifus/retro'
import type { ConfigProblem } from '@/@types/system'
import { AuthorizationBanner } from '@/components/authorization-banner'
import { CheckNotice } from '@/components/check-notice'
import { ConfigNotice } from '@/components/config-notice'
import { HelpProvider } from '@/components/help-provider'
import { JournalPanel } from '@/components/journal-panel'
import { KeyLabelsProvider } from '@/components/key-labels-provider'
import { MapNavigationProvider } from '@/components/map-navigation-provider'
import { ReleaseNoticeBar } from '@/components/release-notice-bar'
import { SceneCredit } from '@/components/retro/scene-credit'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LanguageBar } from '@/components/world/language-bar'
import { MapFrame } from '@/components/world/map-frame'
import { WorldScene } from '@/components/world/world-scene'
import { ONBOARDING_ANCHOR } from '@/constants/onboarding'
import { CLEARING } from '@/constants/world'
import { matchIsDenied } from '@/helpers/authorization'
import { useCurrentMap } from '@/hooks/use-current-map'
import { useEscape } from '@/hooks/use-escape'
import { useMultifus } from '@/hooks/use-multifus'
import { useShowWhenPainted } from '@/hooks/use-show-when-painted'
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
import { DeferredMap } from '@/screens/deferred-map'
import { OnboardingGuide } from '@/screens/onboarding/guide'

export const App = () => {
  const { snapshot, run } = useMultifus()
  const [map, setMap] = useCurrentMap()

  useTrayNavigation(setMap)
  useShowWhenPainted(snapshot?.scanned ?? false)

  const isPreviewing = snapshot?.runeTable.previewing ?? false

  useEscape(isPreviewing, () => {
    run(closeRuneTable())
  })

  useEscape(!isPreviewing && map !== CLEARING, () => {
    setMap(CLEARING)
  })

  if (snapshot === null || !snapshot.scanned) {
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

  const shouldWarnAboutAuthorization =
    matchIsDenied(snapshot.authorization) && map === CLEARING

  return (
    <KeyLabelsProvider labels={snapshot.keyboard}>
      <MapNavigationProvider onGo={setMap}>
        <HelpProvider
          onboarding={snapshot.onboarding}
          isAutoFocusEnabled={snapshot.autoFocusEnabled}
          run={run}
        >
          <TooltipProvider>
            <div className="relative flex h-screen flex-col overflow-hidden pb-ledger font-plain text-khaki">
              <WorldScene map={map} />
              <Shade edge="top" />
              <div className="absolute inset-x-0 top-12 z-45 flex flex-col">
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
                {shouldWarnAboutAuthorization ? (
                  <AuthorizationBanner run={run} />
                ) : null}
                {snapshot.releaseNotice === null ? null : (
                  <ReleaseNoticeBar
                    notice={snapshot.releaseNotice}
                    update={snapshot.update}
                    run={run}
                  />
                )}
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <LanguageBar
                  version={snapshot.version}
                  language={snapshot.language}
                />
                {map === CLEARING ? (
                  <ClearingScreen
                    characters={snapshot.characters}
                    authorization={snapshot.authorization}
                    paintPortraits={snapshot.paintPortraits}
                    onGo={setMap}
                    run={run}
                  />
                ) : (
                  <MapFrame
                    map={map}
                    loopsSeen={snapshot.loopsSeen}
                    run={run}
                    onLeave={() => {
                      setMap(CLEARING)
                    }}
                  >
                    <React.Suspense fallback={null}>
                      <DeferredMap map={map} snapshot={snapshot} run={run} />
                    </React.Suspense>
                  </MapFrame>
                )}
              </div>
              <Shade edge="bottom" />
              <footer className="pointer-events-none absolute inset-x-0 bottom-ledger z-20 flex h-hem items-end px-4 pb-2">
                <SceneCredit />
              </footer>
              <JournalPanel snapshot={snapshot} />
            </div>
          </TooltipProvider>
        </HelpProvider>
      </MapNavigationProvider>
    </KeyLabelsProvider>
  )
}

const quarantinedPath = (problem: ConfigProblem) => {
  return problem.kind === 'malformed' ? problem.quarantined : null
}
