import { t } from '@lingui/core/macro'
import type { Display } from '@/@types/display'
import { PickChip } from '@/components/pick-chip'

type ScreenChipProps = Readonly<{
  screen: Display
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
    <PickChip
      isPicked={isPicked}
      detail={`${screen.width} × ${screen.height}`}
      onPick={onPick}
    >
      {t`Écran ${rank}`}
      {screen.primary ? (
        <span className="pl-1.5 text-mark text-muted-foreground">
          {t`principal`}
        </span>
      ) : null}
    </PickChip>
  )
}
