import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type UnavailableSwitchProps = Readonly<{
  label: string
  reason: string
}>

export const UnavailableSwitch = ({
  label,
  reason
}: UnavailableSwitchProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        role="switch"
        aria-checked={false}
        aria-disabled
        aria-label={label}
        tabIndex={0}
        className="inline-flex cursor-not-allowed rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Switch
          aria-hidden
          checked={false}
          disabled
          className="pointer-events-none"
        />
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
