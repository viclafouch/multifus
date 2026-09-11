import React from 'react'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { PageLink } from '@/components/page-link'
import { MENU_FEATURES } from '@/constants/pages'
import { PAGE_NAMES } from '@/constants/wording'
import { useDismiss } from '@/hooks/use-dismiss'

const FEATURES = msg`Fonctionnalités`

export const FeaturesMenu = () => {
  const { i18n } = useLingui()
  const menu = React.useRef<HTMLDetailsElement>(null)

  useDismiss(menu)

  return (
    <details ref={menu} className="relative flex flex-col">
      <summary className="sighted flex cursor-pointer list-none items-center gap-2 text-way text-muted-foreground transition-colors hover:text-cream">
        {i18n._(FEATURES)}
        <span aria-hidden className="askmark" />
      </summary>
      <ul className="hood absolute top-full left-0 z-50 flex w-way translate-y-3 flex-col rounded-lg p-2">
        {MENU_FEATURES.map((page) => {
          return (
            <li key={page}>
              <PageLink page={page} className="block rounded-sm px-3 py-2">
                {i18n._(PAGE_NAMES[page])}
              </PageLink>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
