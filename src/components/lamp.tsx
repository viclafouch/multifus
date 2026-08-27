import { cn } from '@/lib/utils'

export type LampState = 'excluded' | 'live' | 'offline'

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
        'data-[state=excluded]:border data-[state=excluded]:border-muted-foreground/55 data-[state=excluded]:bg-transparent',
        'data-[state=offline]:bg-muted-foreground/20',
        className
      )}
    />
  )
}
