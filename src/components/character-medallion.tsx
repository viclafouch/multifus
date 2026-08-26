import type { LampState } from '@/components/lamp'
import { cn } from '@/lib/utils'

const PORTRAIT_UNKNOWN = '?'

type CharacterMedallionProps = Readonly<{
  portrait: string | null
  state: LampState
  className?: string
}>

export const CharacterMedallion = ({
  portrait,
  state,
  className
}: CharacterMedallionProps) => {
  return (
    <span
      aria-hidden
      data-state={state}
      data-empty={portrait === null ? '' : undefined}
      className={cn(
        'flex size-medallion shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-card/60 transition-colors duration-300',
        'data-[state=live]:medallion-live data-[state=live]:border-live',
        'data-[state=asleep]:border-idle/70',
        'data-[state=offline]:border-muted-foreground/25',
        'data-empty:border-dashed data-empty:bg-primary/12 data-empty:text-primary',
        'group-hover/portrait:data-empty:bg-primary/25',
        className
      )}
    >
      {portrait === null ? (
        <span className="font-display text-heading leading-none font-semibold">
          {PORTRAIT_UNKNOWN}
        </span>
      ) : (
        <img
          alt=""
          src={portrait}
          className="size-full object-cover in-data-[state=offline]:grayscale"
        />
      )}
    </span>
  )
}
