import React from 'react'
import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

type FooterNavProps = Readonly<{
  title: MessageDescriptor
  pages: readonly PageId[]
}>

export const FooterNav = ({ title, pages }: FooterNavProps) => {
  const { i18n } = useLingui()
  const named = React.useId()

  return (
    <nav aria-labelledby={named} className="flex flex-col gap-3.5">
      <p id={named} className="rubric text-khaki">
        {i18n._(title)}
      </p>
      <ul className="flex flex-col gap-0.5">
        {pages.map((page) => {
          return (
            <li key={page}>
              <PageLink
                page={page}
                isBare
                className="stud sighted py-2 text-aside text-band"
              >
                {i18n._(PAGE_NAMES[page])}
              </PageLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
