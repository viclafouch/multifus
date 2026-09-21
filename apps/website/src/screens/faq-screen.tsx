import type { Icon } from '@phosphor-icons/react'
import { BinocularsIcon } from '@phosphor-icons/react/dist/ssr/Binoculars'
import { CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins'
import { DesktopIcon } from '@phosphor-icons/react/dist/ssr/Desktop'
import { GameControllerIcon } from '@phosphor-icons/react/dist/ssr/GameController'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { TranslateIcon } from '@phosphor-icons/react/dist/ssr/Translate'
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree'
import type { PageScreenProps } from '@/@types/screen'
import { AskReach } from '@/components/ask-reach'
import { AskRow } from '@/components/ask-row'
import { Band } from '@/components/band'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PAGES } from '@/constants/pages'
import { FAQ_ASKS } from '@/constants/questions'
import { FOLD_ANCHOR } from '@/constants/site'
import { useHashOpen } from '@/hooks/use-hash-open'

type FaqAsk = (typeof FAQ_ASKS)[number]

const FAQ_MARKS = {
  inside: BinocularsIcon,
  risk: ShieldCheckIcon,
  safe: SealCheckIcon,
  machine: DesktopIcon,
  modern: GameControllerIcon,
  parity: SquaresFourIcon,
  count: UsersThreeIcon,
  tongue: TranslateIcon,
  money: CoinsIcon
} as const satisfies Record<FaqAsk, Icon>

export const FaqScreen = ({ page }: PageScreenProps) => {
  const { kin } = PAGES[page]

  useHashOpen()

  return (
    <>
      <Band
        id={FOLD_ANCHOR}
        className="grid items-start gap-x-12 gap-y-9 pt-rest-sm pb-rest-xs lg:grid-cols-asks"
      >
        <div className="flex flex-col gap-7 lg:sticky lg:top-fall">
          <PageHead page={page} />
        </div>
        <ul className="slab surface-4">
          {FAQ_ASKS.map((ask) => {
            return (
              <li key={ask} className="rule border-t first:border-t-0">
                <AskRow ask={ask} Mark={FAQ_MARKS[ask]} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal pt-rest-xs pb-rest">
        <AskReach />
      </Band>
      <PageKin pages={kin} />
    </>
  )
}
