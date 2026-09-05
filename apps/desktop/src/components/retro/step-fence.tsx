import { Button } from '@/components/retro/button'

type StepFenceProps = Readonly<{
  labels: readonly string[]
  current: number
  onGo: (rank: number) => void
}>

export const StepFence = ({ labels, current, onGo }: StepFenceProps) => {
  return (
    <ol className="fenceline relative flex h-fence items-start justify-center gap-6">
      <span
        aria-hidden
        className="rail absolute inset-x-1 top-2.5 h-lath rounded-full"
      />
      <span
        aria-hidden
        className="rail absolute inset-x-1 top-5.5 h-lath rounded-full"
      />
      {labels.map((label, rank) => {
        return (
          <li key={label} className="relative">
            <Button
              variant="bare"
              aria-label={label}
              aria-current={rank === current ? 'step' : undefined}
              data-passed={rank < current ? '' : undefined}
              className="h-fence w-knob flex-col gap-0 rounded-none border-transparent p-0 hover:border-transparent hover:bg-transparent"
              onClick={() => {
                onGo(rank)
              }}
            >
              <span className="knob size-knob shrink-0 rounded-full group-hover/button:knob-lit group-aria-[current=step]/button:knob-lit group-aria-[current=step]/button:knob-here group-data-passed/button:knob-lit" />
              <span className="stake w-stake flex-1 rounded-b-xs" />
            </Button>
          </li>
        )
      })}
    </ol>
  )
}
