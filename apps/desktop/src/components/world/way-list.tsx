import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { ScreenName } from '@/@types/snapshot'
import { MAP_NAMES, MAPS } from '@/constants/world'

type WayListProps = Readonly<{
  onGo: (screen: ScreenName) => void
}>

export const WayList = ({ onGo }: WayListProps) => {
  return (
    <nav aria-label={t`Les maps de Multifus`}>
      <ul className="flex w-way flex-col gap-0.5">
        {MAPS.map((map) => {
          return (
            <li key={map}>
              <Button
                variant="way"
                size="way"
                className="w-full justify-start"
                onClick={() => {
                  onGo(map)
                }}
              >
                <span className="wayname">{i18n._(MAP_NAMES[map])}</span>
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
