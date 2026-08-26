import type { BannerCorner, BannerScreen } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { Button } from '@/components/ui/button'
import { CORNER_PLACEMENT, CORNERS } from '@/constants/banner'
import { strings } from '@/constants/strings'
import { monitorShape } from '@/helpers/banner'
import { cn } from '@/lib/utils'

const LEGEND_ID = 'banner-corner'

type CornerPickerProps = Readonly<{
  corner: BannerCorner
  screen: BannerScreen | null
  onPick: (corner: BannerCorner) => void
}>

export const CornerPicker = ({ corner, screen, onPick }: CornerPickerProps) => {
  const shape = monitorShape(screen)

  return (
    <div className="flex flex-col gap-2">
      <Legend id={LEGEND_ID}>{strings.walk.banner.cornerLegend}</Legend>
      <div
        style={{ maxWidth: shape.drawnWidth }}
        className="w-full rounded-lg border border-border bg-card/70 p-2"
      >
        <div
          role="group"
          aria-labelledby={LEGEND_ID}
          style={{ aspectRatio: shape.ratio }}
          className="warm-light grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-md border border-border/60 bg-background p-1.5"
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
        </div>
      </div>
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
