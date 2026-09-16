import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { Point as PointShape } from '@/@types/body'
import { Point } from '@/components/point'

type PointListProps = Readonly<{
  points: readonly PointShape[]
  isSplit?: boolean
}>

export const PointList = ({ points, isSplit = false }: PointListProps) => {
  const { i18n } = useLingui()

  return (
    <ul
      className={cn(
        'gap-4',
        isSplit ? 'grid gap-x-10 md:grid-cols-2' : 'flex flex-col'
      )}
    >
      {points.map((point) => {
        return <Point key={i18n._(point.lead)} point={point} />
      })}
    </ul>
  )
}
