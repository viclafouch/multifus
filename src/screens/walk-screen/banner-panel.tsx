import type { Snapshot } from '@/@types/snapshot'
import type { BannerCorner, BannerPlace, BannerScreen } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Button } from '@/components/ui/button'
import { CORNER_PLACEMENT, CORNERS } from '@/constants/banner'
import { strings } from '@/constants/strings'
import { screenOf } from '@/helpers/banner'
import { useBannerScreens } from '@/hooks/use-banner-screens'
import { setBannerCorner, setBannerScreen } from '@/lib/multifus'
import { cn } from '@/lib/utils'

const WIDESCREEN = 16 / 9

type BannerPanelProps = Readonly<{
  place: BannerPlace
  run: (action: Promise<Snapshot>) => void
}>

export const BannerPanel = ({ place, run }: BannerPanelProps) => {
  const screens = useBannerScreens()
  const picked = screenOf(screens, place.screen)

  return (
    <Panel className="mt-3">
      <PanelHeader
        title={strings.walk.banner.title}
        description={strings.walk.banner.description}
      />
      <div className="flex flex-wrap items-start gap-6 px-4 py-4">
        <div className="flex flex-col gap-2">
          <Legend>{strings.walk.banner.cornerLegend}</Legend>
          <CornerPicker
            corner={place.corner}
            ratio={picked === null ? WIDESCREEN : picked.width / picked.height}
            onPick={(corner) => {
              run(setBannerCorner(corner))
            }}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {screens.length > 1 ? (
            <>
              <Legend>{strings.walk.banner.screenLegend}</Legend>
              <div className="flex flex-wrap gap-2">
                {screens.map((screen, rank) => {
                  return (
                    <ScreenChip
                      key={screen.name ?? rank}
                      screen={screen}
                      rank={rank + 1}
                      isPicked={screen === picked}
                      onPick={() => {
                        run(setBannerScreen(screen.name))
                      }}
                    />
                  )
                })}
              </div>
            </>
          ) : null}
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.walk.banner.hint}
          </p>
        </div>
      </div>
    </Panel>
  )
}

type CornerPickerProps = Readonly<{
  corner: BannerCorner
  ratio: number
  onPick: (corner: BannerCorner) => void
}>

const CornerPicker = ({ corner, ratio, onPick }: CornerPickerProps) => {
  return (
    <div
      style={{ aspectRatio: ratio }}
      className="grid w-52 shrink-0 grid-cols-2 grid-rows-2 gap-1 rounded-md border border-border bg-background/55 p-1.5"
    >
      {CORNERS.map((each) => {
        return (
          <Button
            key={each}
            variant="ghost"
            aria-pressed={each === corner}
            aria-label={strings.walk.banner.corners[each]}
            className={cn(
              'group h-auto rounded-xs p-1',
              CORNER_PLACEMENT[each].anchor
            )}
            onClick={() => {
              onPick(each)
            }}
          >
            <MiniBanner />
          </Button>
        )
      })}
    </div>
  )
}

const MiniBanner = () => {
  return (
    <span
      aria-hidden
      className="flex items-center gap-1 rounded-full border border-primary/35 bg-card px-1 py-0.5 opacity-0 transition-suspend group-hover:opacity-40 group-aria-pressed:opacity-100"
    >
      <span className="size-1.5 rounded-full bg-live" />
      <span className="h-1 w-7 rounded-full bg-foreground/35" />
    </span>
  )
}

type ScreenChipProps = Readonly<{
  screen: BannerScreen
  rank: number
  isPicked: boolean
  onPick: () => void
}>

const ScreenChip = ({ screen, rank, isPicked, onPick }: ScreenChipProps) => {
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
