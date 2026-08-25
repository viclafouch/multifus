import { cn } from '@/lib/utils'

export type LampState = 'asleep' | 'live' | 'offline'

type LampProps = Readonly<{
  state: LampState
  className?: string
}>

export const Lamp = ({ state, className }: LampProps) => {
  return (
    <span
      aria-hidden
      data-state={state}
      className={cn(
        'size-lamp shrink-0 rounded-full transition-colors duration-300',
        'data-[state=live]:lamp-live data-[state=live]:bg-live',
        'data-[state=asleep]:border data-[state=asleep]:border-muted-foreground/55 data-[state=asleep]:bg-transparent',
        'data-[state=offline]:bg-muted-foreground/20',
        className
      )}
    />
  )
}
