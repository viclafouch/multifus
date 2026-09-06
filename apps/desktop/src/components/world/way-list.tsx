import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { ScreenName } from '@/@types/snapshot'
import { Button } from '@/components/retro/button'
import { MAP_NAMES, MAPS } from '@/constants/world'

type WayListProps = Readonly<{
  asking: ScreenName | null
  onGo: (screen: ScreenName) => void
}>

export const WayList = ({ asking, onGo }: WayListProps) => {
  return (
    <nav aria-label={t`Les maps de Multifus`}>
      <ul className="flex w-way flex-col gap-0.5">
        {MAPS.map((map) => {
          return (
            <li key={map}>
              <Button
                variant="bare"
                size="way"
                className="w-full justify-start"
                onClick={() => {
                  onGo(map)
                }}
              >
                {i18n._(MAP_NAMES[map])}
                {map === asking ? (
                  <>
                    <span
                      aria-hidden
                      className="ml-auto size-1.5 rounded-full bg-flame"
                    />
                    <span className="sr-only">{t`À régler`}</span>
                  </>
                ) : null}
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
