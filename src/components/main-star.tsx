import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'

type MainStarProps = Readonly<{
  nickname: string
  isMain: boolean
  onToggle: () => void
}>

export const MainStar = ({ nickname, isMain, onToggle }: MainStarProps) => {
  const words = strings.characters

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-xs" />}
        aria-pressed={isMain}
        aria-label={words.mainToggle(nickname)}
        className="shrink-0"
        onClick={onToggle}
      >
        <Star
          strokeWidth={1.75}
          className="size-3.5 text-muted-foreground/30 transition-colors duration-200 group-hover:text-muted-foreground/70 group-hover/button:text-muted-foreground/70 group-aria-pressed/button:star-lit group-aria-pressed/button:fill-current group-aria-pressed/button:text-primary"
        />
      </TooltipTrigger>
      <TooltipContent>
        {isMain ? words.mainUnset : words.mainSet}
      </TooltipContent>
    </Tooltip>
  )
}
