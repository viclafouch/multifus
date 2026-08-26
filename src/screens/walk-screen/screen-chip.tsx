import type { BannerScreen } from '@/@types/walk'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'

type ScreenChipProps = Readonly<{
  screen: BannerScreen
  rank: number
  isPicked: boolean
  onPick: () => void
}>

export const ScreenChip = ({
  screen,
  rank,
  isPicked,
  onPick
}: ScreenChipProps) => {
  return (
    <Button
      variant="ghost"
      aria-pressed={isPicked}
      onClick={onPick}
      className="h-auto flex-col items-start gap-0.5 rounded-lg border border-border px-3 py-2 aria-pressed:border-primary/45 aria-pressed:bg-primary/8"
    >
      <span className="text-note font-medium">
        {strings.walk.banner.screenName(rank)}
        {screen.primary ? (
          <span className="pl-1.5 text-micro text-muted-foreground">
            {strings.walk.banner.screenPrimary}
          </span>
        ) : null}
      </span>
      <span className="font-mono text-micro text-muted-foreground">
        {strings.walk.banner.screenSize(screen.width, screen.height)}
      </span>
    </Button>
  )
}
