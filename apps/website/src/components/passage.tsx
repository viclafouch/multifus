import { useLingui } from '@lingui/react'
import type { Passage as PassageShape } from '@/@types/body'
import { BandTitle } from '@/components/band-title'
import { PointList } from '@/components/point-list'

type PassageProps = Readonly<{
  passage: PassageShape
}>

export const Passage = ({ passage }: PassageProps) => {
  const { i18n } = useLingui()

  return (
    <section className="flex flex-col gap-5">
      <BandTitle size="passage">{i18n._(passage.title)}</BandTitle>
      <PointList points={passage.points} />
    </section>
  )
}
