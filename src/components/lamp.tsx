import { cn } from '@/lib/utils'

type LampProps = Readonly<{
  isOnline: boolean
  isAsleep: boolean
  className?: string
}>

/**
 * The status light of a character.
 *
 * Three states and one colour. The ochre is spent only on a character that is
 * connected and in the cycle, which is the single thing the board is read for;
 * asleep is a hollow ring, offline is a dead dot.
 *
 * It carries no label: the row spells the state out in words right next to it.
 */
export const Lamp = ({ isOnline, isAsleep, className }: LampProps) => {
  return (
    <span
      aria-hidden
      data-state={lampState({ isOnline, isAsleep })}
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

type LampStateParams = Readonly<{
  isOnline: boolean
  isAsleep: boolean
}>

const lampState = ({ isOnline, isAsleep }: LampStateParams) => {
  if (!isOnline) {
    return 'offline'
  }

  return isAsleep ? 'asleep' : 'live'
}
