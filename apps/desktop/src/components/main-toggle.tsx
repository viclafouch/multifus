import { t } from '@lingui/core/macro'
import { MainMark } from '@/components/main-mark'
import { Button } from '@/components/retro/button'
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
        render={<Button variant="glint" size="icon-tight" />}
        aria-pressed={isMain}
        aria-label={t`${nickname} comme personnage principal`}
        className="shrink-0"
        onClick={onToggle}
      >
        <MainMark isMain={isMain} className="size-4.5" />
      </TooltipTrigger>
      <TooltipContent>
        {isMain
          ? t`Ne plus en faire votre personnage principal`
          : t`En faire votre personnage principal`}
      </TooltipContent>
    </Tooltip>
  )
}
