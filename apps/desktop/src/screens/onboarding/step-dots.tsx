import type { Page } from '@/@types/onboarding'
import { Button } from '@/components/ui/button'
import { pageLabel } from '@/helpers/onboarding'

type StepDotsProps = Readonly<{
  pages: readonly Page[]
  current: number
  onGo: (rank: number) => void
}>

export const StepDots = ({ pages, current, onGo }: StepDotsProps) => {
  return (
    <ol className="flex items-center justify-center gap-0.5">
      {pages.map((page, rank) => {
        return (
          <li key={page}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={pageLabel(page)}
              aria-current={rank === current ? 'step' : undefined}
              data-passed={rank < current ? '' : undefined}
              className="rounded-full hover:bg-transparent"
              onClick={() => {
                onGo(rank)
              }}
            >
              <span className="size-2 rounded-full bg-border transition-row group-hover/button:bg-foreground/35 group-aria-[current=step]/button:main-lit group-aria-[current=step]/button:bg-primary group-data-passed/button:bg-primary/45" />
            </Button>
          </li>
        )
      })}
    </ol>
  )
}
