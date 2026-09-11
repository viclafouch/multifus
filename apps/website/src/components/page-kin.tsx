import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { PageCard } from '@/components/page-card'

const ALSO_SEE = msg`À voir aussi`

type PageKinProps = Readonly<{
  pages: readonly PageId[]
}>

export const PageKin = ({ pages }: PageKinProps) => {
  const { i18n } = useLingui()

  return (
    <Band>
      <BandTitle>{i18n._(ALSO_SEE)}</BandTitle>
      <ul className="grid gap-4 sm:grid-cols-2">
        {pages.map((page) => {
          return (
            <li key={page}>
              <PageCard page={page} />
            </li>
          )
        })}
      </ul>
    </Band>
  )
}
