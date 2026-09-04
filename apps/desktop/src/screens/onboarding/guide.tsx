import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { Button } from '@/components/ui/button'
import { pagesOf } from '@/helpers/onboarding'
import { finishOnboarding, requestAuthorization } from '@/lib/multifus'
import { StepDots } from '@/screens/onboarding/step-dots'
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
  const status =
    onboarding.steps.find((candidate) => {
      return candidate.step === page
    }) ?? null

  const finish = () => {
    run(finishOnboarding())
  }

  return (
    <div className="stage relative flex h-screen flex-col">
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />
      <header className="relative flex shrink-0 items-center px-5 py-3.5">
        {current === 0 ? null : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setCurrent((previous) => {
                return previous - 1
              })
            }}
          >
            <ArrowLeft aria-hidden />
            {t`Retour`}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground"
          onClick={finish}
        >
          {t`Passer`}
        </Button>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-4">
        <StepPage
          key={page}
          page={page}
          status={status}
          characters={characters}
          rank={current + 1}
          count={pages.length}
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
      <footer className="relative shrink-0 px-5 pt-2 pb-5">
        <StepDots pages={pages} current={current} onGo={setCurrent} />
      </footer>
    </div>
  )
}
