import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { PageId } from '@/@types/page'
import {
  HINGE_ENTRY,
  HINGE_NAME,
  HINGE_PANEL,
  HingeTab
} from '@/components/mast-hinge'
import { PageLink } from '@/components/page-link'
import { MENU_FEATURES } from '@/constants/pages'
import { PAGE_PORTRAITS, PORTRAIT_SIDE } from '@/constants/portraits'
import { FEATURES_TAB, MENU_HINTS, PAGE_NAMES } from '@/constants/wording'
import { useHinge } from '@/hooks/use-hinge'

type FeaturesMenuProps = Readonly<{
  page: PageId
}>

export const FeaturesMenu = ({ page }: FeaturesMenuProps) => {
  const { i18n } = useLingui()
  const { hinge, close } = useHinge()
  const isHere = MENU_FEATURES.some((feature) => {
    return feature === page
  })

  return (
    <details ref={hinge} className="hinge hidden flex-col lg:flex">
      <HingeTab label={FEATURES_TAB} isHere={isHere} />
      <ul className={cn(HINGE_PANEL, 'shelf grid grid-cols-1 sm:grid-cols-2')}>
        {MENU_FEATURES.map((feature) => {
          return (
            <li key={feature}>
              <PageLink page={feature} onClick={close} className={HINGE_ENTRY}>
                <img
                  src={PAGE_PORTRAITS[feature]}
                  alt=""
                  width={PORTRAIT_SIDE}
                  height={PORTRAIT_SIDE}
                  loading="lazy"
                  decoding="async"
                  className="effigy size-10 shrink-0"
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={HINGE_NAME}>
                    {i18n._(PAGE_NAMES[feature])}
                  </span>
                  <span className="text-mark text-band">
                    {i18n._(MENU_HINTS[feature])}
                  </span>
                </span>
              </PageLink>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
