import type { LampState } from '@/components/lamp'
import { cn } from '@/lib/utils'

type CharacterMedallionProps = Readonly<{
  nickname: string
  portrait: string | null
  state: LampState
  className?: string
}>

export const CharacterMedallion = ({
  nickname,
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
        'data-[state=offline]:border-muted-foreground/25 data-[state=offline]:grayscale',
        'data-empty:border-dashed',
        className
      )}
    >
      {portrait === null ? (
        <span className="font-display text-row font-medium text-muted-foreground/70">
          {initialOf(nickname)}
        </span>
      ) : (
        <img alt="" src={portrait} className="size-full object-cover" />
      )}
    </span>
  )
}

const initialOf = (nickname: string) => {
  return (Array.from(nickname)[0] ?? '').toUpperCase()
}
