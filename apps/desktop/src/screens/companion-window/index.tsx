import React from 'react'
import { ArrowLeft, House, LoaderCircle, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Hole } from '@/@types/companion'
import { CrownButton } from '@/components/crown-button'
import { COMPANION_SITE_CARDS } from '@/constants/companion'
import { useMeasuredHole } from '@/hooks/use-measured-hole'
import { useMultifus } from '@/hooks/use-multifus'
import { useWindowDrag } from '@/hooks/use-window-drag'
import {
  closeCompanion,
  companionBack,
  companionHome,
  companionMeasured,
  companionSettled,
  moveCompanion,
  stretchCompanion
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'

const tellHole = (hole: Hole) => {
  companionMeasured(hole).catch(ignore)
}

const moveFrame = (byX: number, byY: number) => {
  moveCompanion(byX, byY).catch(ignore)
}

const stretchFrame = (byX: number, byY: number) => {
  stretchCompanion(byX, byY).catch(ignore)
}

const settleFrame = () => {
  companionSettled().catch(ignore)
}

const goBack = () => {
  companionBack().catch(ignore)
}

const goHome = () => {
  companionHome().catch(ignore)
}

const closeFrame = () => {
  closeCompanion().catch(ignore)
}

export const CompanionWindow = () => {
  const hole = React.useRef<HTMLDivElement>(null)
  const { snapshot } = useMultifus()
  const drag = useWindowDrag({ onMove: moveFrame, onSettle: settleFrame })
  const stretch = useWindowDrag({ onMove: stretchFrame, onSettle: settleFrame })
  const name =
    snapshot === null ? '' : COMPANION_SITE_CARDS[snapshot.companionSite].name

  useMeasuredHole(hole, tellHole)

  return (
    <div className="companion-frame">
      <header
        {...drag}
        className="sheet-crown cursor-grab active:cursor-grabbing"
      >
        <h1 className="min-w-0 flex-1 truncate text-tale leading-none font-medium">
          {name}
        </h1>
        <CrownButton label={t`Page précédente`} onClick={goBack}>
          <ArrowLeft aria-hidden strokeWidth={2} />
        </CrownButton>
        <CrownButton label={t`Accueil du site`} onClick={goHome}>
          <House aria-hidden strokeWidth={2} />
        </CrownButton>
        <CrownButton label={t`Fermer le site`} isClosing onClick={closeFrame}>
          <X aria-hidden strokeWidth={2} />
        </CrownButton>
      </header>
      <div ref={hole} className="grid place-items-center">
        <LoaderCircle
          aria-hidden
          strokeWidth={2}
          className="size-5 animate-spin text-muted-foreground"
        />
      </div>
      <footer className="companion-foot">
        <div
          {...stretch}
          role="separator"
          aria-label={t`Agrandir le site`}
          className="companion-grip"
        >
          <svg viewBox="0 0 10 10" aria-hidden className="size-2.5">
            <path
              d="M9 2 2 9M9 5.5 5.5 9"
              stroke="currentColor"
              strokeWidth={1.25}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </footer>
    </div>
  )
}
