import { Tick } from '@/components/retro/tick'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type UnavailableTickProps = Readonly<{
  label: string
  reason: string
  checked: boolean
  className?: string
}>

export const UnavailableTick = ({
  label,
  reason,
  checked,
  className
}: UnavailableTickProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        role="switch"
        aria-checked={checked}
        aria-disabled
        aria-label={label}
        tabIndex={0}
        className="inline-flex cursor-not-allowed rounded-xs sighted"
      >
        <Tick
          aria-hidden
          checked={checked}
          disabled
          className={cn('pointer-events-none', className)}
        />
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
