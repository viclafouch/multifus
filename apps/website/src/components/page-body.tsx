import { useLingui } from '@lingui/react'
import type { Body } from '@/@types/body'
import { Band } from '@/components/band'
import { BoonCard } from '@/components/boon-card'
import { CaveatList } from '@/components/caveat-list'
import { Opening } from '@/components/opening'

type PageBodyProps = Readonly<{
  body: Body
}>

export const PageBody = ({ body }: PageBodyProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <Band className="pt-14 pb-8">
        <Opening>{i18n._(body.lead)}</Opening>
      </Band>
      <Band className="reveal py-8">
        <ul className="grid gap-drop sm:grid-cols-2">
          {body.boons.map((boon) => {
            return <BoonCard key={i18n._(boon.title)} boon={boon} />
          })}
        </ul>
      </Band>
      {body.caveats.length === 0 ? null : (
        <Band className="reveal pt-8 pb-16">
          <CaveatList caveats={body.caveats} />
        </Band>
      )}
    </>
  )
}
