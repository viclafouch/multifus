import React from 'react'
import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { Button } from '@/components/retro/button'
import { ChapterCard } from '@/components/retro/chapter-card'
import { Scene, SceneCredit } from '@/components/retro/scene'
import { StepFence } from '@/components/retro/step-fence'
import { pageLabel, pagesOf } from '@/helpers/onboarding'
import { finishOnboarding, requestAuthorization } from '@/lib/multifus'
import { StepPage } from '@/screens/onboarding/step-page'

type OnboardingGuideProps = Readonly<{
  onboarding: Onboarding
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

export const OnboardingGuide = ({
  onboarding,
  characters,
  run
}: OnboardingGuideProps) => {
  const [current, setCurrent] = React.useState(0)

  const pages = pagesOf(onboarding)
  const page = pages[current]
  const last = pages.length - 1
  const rank = current + 1
  const count = pages.length
  const status =
    onboarding.steps.find((candidate) => {
      return candidate.step === page
    }) ?? null

  const finish = () => {
    run(finishOnboarding())
  }

  return (
    <div className="relative flex h-screen flex-col font-plain text-khaki">
      <Scene page={page} />
      <ChapterCard
        key={page}
        legend={t`Étape ${rank} sur ${count}`}
        title={pageLabel(page)}
      />
      <header className="lift lift-chrome relative flex shrink-0 items-center px-4 py-3">
        {current === 0 ? null : (
          <Button
            variant="bare"
            size="sm"
            onClick={() => {
              setCurrent((previous) => {
                return previous - 1
              })
            }}
          >
            {t`Retour`}
          </Button>
        )}
        <Button variant="bare" size="sm" className="ml-auto" onClick={finish}>
          {t`Passer`}
        </Button>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <StepPage
          key={page}
          page={page}
          status={status}
          characters={characters}
          rank={rank}
          count={count}
          onNext={() => {
            if (current === last) {
              finish()

              return
            }

            setCurrent((previous) => {
              return previous + 1
            })
          }}
          onAsk={() => {
            run(requestAuthorization())
          }}
        />
      </main>
      <footer className="lift lift-chrome relative flex shrink-0 flex-col items-center gap-3 px-5 pt-2 pb-4">
        <StepFence
          labels={pages.map((candidate) => {
            return pageLabel(candidate)
          })}
          current={current}
          onGo={setCurrent}
        />
        <SceneCredit />
      </footer>
    </div>
  )
}
