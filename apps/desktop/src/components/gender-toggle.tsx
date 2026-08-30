import type { Gender } from '@/@types/roster'
import { GenderSigil } from '@/components/gender-sigil'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type GenderToggleProps = Readonly<{
  gender: Gender
  isIncluded: boolean
  label: string
  hint: string
  note: string | null
  onToggle: () => void
}>

export const GenderToggle = ({
  gender,
  isIncluded,
  label,
  hint,
  note,
  onToggle
}: GenderToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" />}
        aria-pressed={isIncluded}
        aria-label={label}
        className="size-fit rounded-full border-0 p-0.5"
        onClick={onToggle}
      >
        <GenderSigil
          gender={gender}
          className="opacity-45 saturate-0 group-hover/button:opacity-75 group-aria-pressed/button:sigil-lit group-aria-pressed/button:opacity-100 group-aria-pressed/button:saturate-100"
        />
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start gap-0.5">
        <span>{hint}</span>
        {note === null ? null : (
          <span className="text-background/70">{note}</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
