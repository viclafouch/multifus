import React from 'react'
import { t } from '@lingui/core/macro'
import type { Language } from '@/@types/language'
import type { Onboarding } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/retro/button'
import { ChapterCard } from '@/components/retro/chapter-card'
import { Scene } from '@/components/retro/scene'
import { SceneCredit } from '@/components/retro/scene-credit'
import { StepFence } from '@/components/retro/step-fence'
import { pageLabel, pagesOf } from '@/helpers/onboarding'
import { finishOnboarding, requestAuthorization } from '@/lib/multifus'
import { StepPage } from '@/screens/onboarding/step-page'

type OnboardingGuideProps = Readonly<{
  onboarding: Onboarding
  characters: readonly Character[]
  language: Language
  run: (action: Promise<Snapshot>) => void
}>

export const OnboardingGuide = ({
  onboarding,
  characters,
  language,
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
      <header className="brow lift lift-chrome relative flex shrink-0 items-center px-4 py-3">
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
        <div className="ml-auto flex items-center gap-4">
          <LanguagePicker current={language} />
          <Button variant="bare" size="sm" onClick={finish}>
            {t`Passer`}
          </Button>
        </div>
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
