import type { Character } from '@/@types/roster'
import { Tick } from '@/components/retro/tick'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { UnavailableTick } from '@/components/unavailable-tick'
import { matchIsInCycle } from '@/helpers/cycle'
import { cycleToggleLabel, cycleToggleTooltip } from '@/helpers/wording'

const EXCLUDED_TINT = 'group-data-excluded:data-unchecked:bg-destructive/45'

type CycleToggleProps = Readonly<{
  character: Character
  onToggle: () => void
}>

export const CycleToggle = ({ character, onToggle }: CycleToggleProps) => {
  const label = cycleToggleLabel(character.nickname)
  const tooltip = cycleToggleTooltip(character)

  if (!character.online) {
    return (
      <UnavailableTick
        label={label}
        reason={tooltip}
        checked={false}
        className={EXCLUDED_TINT}
      />
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Tick
            checked={matchIsInCycle(character)}
            onCheckedChange={onToggle}
          />
        }
        aria-label={label}
        className={EXCLUDED_TINT}
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
