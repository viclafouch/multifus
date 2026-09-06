import { Tick } from '@/components/retro/tick'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type UnavailableTickProps = Readonly<{
  label: string
  reason: string
  checked: boolean
}>

export const UnavailableTick = ({
  label,
  reason,
  checked
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
          className="pointer-events-none"
        />
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
