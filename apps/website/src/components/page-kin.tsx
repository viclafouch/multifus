import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { Vignette } from '@/components/vignette'

const ALSO_SEE = msg`À voir aussi`

type PageKinProps = Readonly<{
  pages: readonly PageId[]
}>

export const PageKin = ({ pages }: PageKinProps) => {
  const { i18n } = useLingui()

  return (
    <Band className="reveal">
      <BandTitle>{i18n._(ALSO_SEE)}</BandTitle>
      <ul className="grid gap-drop sm:grid-cols-2">
        {pages.map((page) => {
          return (
            <li key={page}>
              <Vignette page={page} />
            </li>
          )
        })}
      </ul>
    </Band>
  )
}
