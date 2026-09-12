import React from 'react'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { MENU_FEATURES } from '@/constants/pages'
import { MENU_HINTS, PAGE_NAMES } from '@/constants/wording'
import { useDismiss } from '@/hooks/use-dismiss'

const FEATURES = msg`Fonctionnalités`

type FeaturesMenuProps = Readonly<{
  page: PageId
}>

export const FeaturesMenu = ({ page }: FeaturesMenuProps) => {
  const { i18n } = useLingui()
  const menu = React.useRef<HTMLDetailsElement>(null)
  const isHere = MENU_FEATURES.some((feature) => {
    return feature === page
  })

  useDismiss(menu)

  return (
    <details ref={menu} className="flex flex-col">
      <summary
        aria-current={isHere ? 'location' : undefined}
        className="tab sighted flex cursor-pointer list-none items-center gap-2 text-deed"
      >
        {i18n._(FEATURES)}
        <span aria-hidden className="askmark" />
      </summary>
      <ul className="canopy unfold shelf absolute top-full left-0 z-50 grid grid-cols-1 gap-1 rounded-xl p-2 sm:grid-cols-2">
        {MENU_FEATURES.map((feature) => {
          return (
            <li key={feature}>
              <PageLink
                page={feature}
                className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 hover:bg-slate/50"
              >
                <span className="font-carve text-deed tracking-wide text-cream uppercase">
                  {i18n._(PAGE_NAMES[feature])}
                </span>
                <span className="text-mark text-band">
                  {i18n._(MENU_HINTS[feature])}
                </span>
              </PageLink>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
