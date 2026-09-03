import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import type { BannerPlace } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { screenOf } from '@/helpers/banner'
import { useBannerScreens } from '@/hooks/use-banner-screens'
import { setBannerCorner, setBannerScreen } from '@/lib/multifus'
import { CornerPicker } from '@/screens/walk-screen/corner-picker'
import { ScreenChip } from '@/screens/walk-screen/screen-chip'

type BannerPanelProps = Readonly<{
  place: BannerPlace
  run: (action: Promise<Snapshot>) => void
}>

export const BannerPanel = ({ place, run }: BannerPanelProps) => {
  const screens = useBannerScreens()
  const picked = screenOf(screens, place.screen)

  return (
    <Panel>
      <PanelHeader
        title={t`La bannière`}
        description={t`Elle s’affiche tant que le Déplacement rapide est allumé, et dit sur quel personnage vous venez d’arriver.`}
      />
      <div className="flex flex-col gap-3 px-4 py-4">
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
    </Panel>
  )
}
