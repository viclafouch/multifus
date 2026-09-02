import type { Color } from '@/@types/roster'
import { COLOR_TINTS } from '@/constants/colors'
import { cn } from '@/lib/utils'

type ColorStripeProps = Readonly<{
  color: Color
  className?: string
}>

export const ColorStripe = ({ color, className }: ColorStripeProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'stripe w-stripe shrink-0 rounded-full',
        COLOR_TINTS[color],
        className
      )}
    />
  )
}
