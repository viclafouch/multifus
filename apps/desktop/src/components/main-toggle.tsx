import { MainStar } from '@/components/main-star'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'

type MainToggleProps = Readonly<{
  nickname: string
  isMain: boolean
  onToggle: () => void
}>

export const MainToggle = ({ nickname, isMain, onToggle }: MainToggleProps) => {
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
        <MainStar isMain={isMain} />
      </TooltipTrigger>
      <TooltipContent>
        {isMain ? words.mainUnset : words.mainSet}
      </TooltipContent>
    </Tooltip>
  )
}
