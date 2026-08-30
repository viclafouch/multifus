import type { Display } from '@/@types/display'
import type { BannerCorner } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { ScreenFrame } from '@/components/layout/screen-frame'
import { Button } from '@/components/ui/button'
import { CORNER_PLACEMENT, CORNERS } from '@/constants/banner'
import { strings } from '@/constants/strings'
import { monitorShape } from '@/helpers/banner'
import { cn } from '@/lib/utils'

type CornerPickerProps = Readonly<{
  corner: BannerCorner
  screen: Display | null
  onPick: (corner: BannerCorner) => void
}>

export const CornerPicker = ({ corner, screen, onPick }: CornerPickerProps) => {
  const shape = monitorShape(screen)

  return (
    <div className="flex flex-col gap-2">
      <Legend>{strings.walk.banner.cornerLegend}</Legend>
      <ScreenFrame
        ratio={shape.ratio}
        width={shape.drawnWidth}
        label={strings.walk.banner.cornerLegend}
        className="grid grid-cols-2 grid-rows-2 gap-1 p-1.5"
      >
        {CORNERS.map((each) => {
          return (
            <Button
              key={each}
              variant="ghost"
              aria-pressed={each === corner}
              aria-label={strings.walk.banner.corners[each]}
              className={cn(
                'group h-auto rounded-sm p-1.5 aria-pressed:bg-primary/6',
                CORNER_PLACEMENT[each].anchor
              )}
              onClick={() => {
                onPick(each)
              }}
            >
              <MiniBanner
                width={shape.bannerWidth}
                height={shape.bannerHeight}
              />
            </Button>
          )
        })}
      </ScreenFrame>
    </div>
  )
}

type MiniBannerProps = Readonly<{
  width: number
  height: number
}>

const MiniBanner = ({ width, height }: MiniBannerProps) => {
  return (
    <span
      aria-hidden
      style={{ width, height }}
      className="flex max-w-full items-center gap-1 rounded-full border border-primary/40 bg-background/92 px-1 opacity-0 transition-suspend group-hover:opacity-45 group-aria-pressed:opacity-100"
    >
      <span className="aspect-square h-3/5 shrink-0 rounded-full bg-live" />
      <span className="h-1/4 flex-1 rounded-full bg-foreground/35" />
    </span>
  )
}
