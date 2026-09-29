import { t } from '@lingui/core/macro'
import type { CompanionSite } from '@/@types/companion'
import type { Snapshot } from '@/@types/snapshot'
import { PickChip } from '@/components/pick-chip'
import { COMPANION_SITES, COMPANION_SITE_CARDS } from '@/constants/companion'
import { setCompanionSite } from '@/lib/multifus'

type CompanionSitePickerProps = Readonly<{
  current: CompanionSite
  run: (action: Promise<Snapshot>) => void
}>

export const CompanionSitePicker = ({
  current,
  run
}: CompanionSitePickerProps) => {
  return (
    <div
      role="group"
      aria-label={t`Le site du raccourci`}
      className="flex items-stretch gap-2"
    >
      {COMPANION_SITES.map((site) => {
        const isPicked = site === current
        const card = COMPANION_SITE_CARDS[site]

        return (
          <PickChip
            key={site}
            isPicked={isPicked}
            detail={card.host}
            onPick={() => {
              if (!isPicked) {
                run(setCompanionSite(site))
              }
            }}
          >
            {card.name}
          </PickChip>
        )
      })}
    </div>
  )
}
