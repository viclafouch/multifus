import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import type { BannerPlace } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { Button } from '@/components/retro/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { screenOf } from '@/helpers/banner'
import { useBannerScreens } from '@/hooks/use-banner-screens'
import { setBannerCorner, setBannerScreen } from '@/lib/multifus'
import { CornerPicker } from '@/screens/walk-screen/corner-picker'
import { ScreenChip } from '@/screens/walk-screen/screen-chip'

type BannerDialogProps = Readonly<{
  place: BannerPlace
  run: (action: Promise<Snapshot>) => void
}>

export const BannerDialog = ({ place, run }: BannerDialogProps) => {
  const screens = useBannerScreens()
  const picked = screenOf(screens, place.screen)
  const title = t`La bannière`

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="slate" size="sm" />}>
        {title}
      </DialogTrigger>
      <DialogContent className="plate max-w-scene">
        <DialogHeader>
          <DialogTitle className="font-carve text-bar tracking-wide text-cream uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="text-aside text-khaki">
            {t`Elle dit sur quel personnage vous venez d’arriver.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {screens.length > 1 ? (
            <div className="flex flex-col gap-2">
              <Legend>{t`L’écran`}</Legend>
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
            </div>
          ) : null}
          <CornerPicker
            corner={place.corner}
            screen={picked}
            onPick={(corner) => {
              run(setBannerCorner(corner))
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
