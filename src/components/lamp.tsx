import { cn } from '@/lib/utils'

/**
 * Three states and one colour: the ochre goes to `live` alone, `asleep` is a
 * hollow ring and `offline` a dead dot.
 */
export type LampState = 'asleep' | 'live' | 'offline'

type LampProps = Readonly<{
  state: LampState
  className?: string
}>

/**
 * The status light of this window, on a character or on the relay. It carries no
 * label: whatever it sits next to spells the state out right beside it.
 */
export const Lamp = ({ state, className }: LampProps) => {
  return (
    <span
      aria-hidden
      data-state={state}
      className={cn(
        'size-lamp shrink-0 rounded-full transition-colors duration-300',
        'data-[state=live]:lamp-live data-[state=live]:bg-primary',
        'data-[state=asleep]:border data-[state=asleep]:border-muted-foreground/55 data-[state=asleep]:bg-transparent',
        'data-[state=offline]:bg-muted-foreground/20',
        className
      )}
    />
  )
}
