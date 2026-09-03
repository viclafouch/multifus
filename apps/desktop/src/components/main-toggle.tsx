import { t } from '@lingui/core/macro'
import { MainStar } from '@/components/main-star'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type MainToggleProps = Readonly<{
  nickname: string
  isMain: boolean
  onToggle: () => void
}>

export const MainToggle = ({ nickname, isMain, onToggle }: MainToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-xs" />}
        aria-pressed={isMain}
        aria-label={t`${nickname} comme personnage principal`}
        className="shrink-0"
        onClick={onToggle}
      >
        <MainStar isMain={isMain} />
      </TooltipTrigger>
      <TooltipContent>
        {isMain
          ? t`Ne plus en faire votre personnage principal`
          : t`En faire votre personnage principal`}
      </TooltipContent>
    </Tooltip>
  )
}
