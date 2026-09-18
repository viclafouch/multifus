import { useLingui } from '@lingui/react'
import type { Point as PointShape } from '@/@types/body'
import { Point } from '@/components/point'

type PointListProps = Readonly<{
  points: readonly PointShape[]
}>

export const PointList = ({ points }: PointListProps) => {
  const { i18n } = useLingui()

  return (
    <ul className="flex flex-col gap-4">
      {points.map((point) => {
        return <Point key={i18n._(point.lead)} point={point} />
      })}
    </ul>
  )
}
