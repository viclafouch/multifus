import { useLingui } from '@lingui/react'
import type { Passage as PassageShape } from '@/@types/body'
import { BandTitle } from '@/components/band-title'
import { Plate } from '@/components/plate'
import { PointList } from '@/components/point-list'

type LimitPlateProps = Readonly<{
  limit: PassageShape
}>

export const LimitPlate = ({ limit }: LimitPlateProps) => {
  const { i18n } = useLingui()

  return (
    <Plate isBare className="sm:p-9">
      <div className="avowal grid gap-6 lg:gap-12">
        <BandTitle>{i18n._(limit.title)}</BandTitle>
        <PointList points={limit.points} />
      </div>
    </Plate>
  )
}
