import { useLingui } from '@lingui/react'
import type { SystemId } from '@/@types/system'
import { Plate } from '@/components/plate'
import { SYSTEM_MOVES, SYSTEM_NAMES } from '@/constants/systems'

type SystemMovesProps = Readonly<{
  system: SystemId
}>

export const SystemMoves = ({ system }: SystemMovesProps) => {
  const { i18n } = useLingui()

  return (
    <Plate className="h-full gap-6">
      <h3 className="nameplate">{SYSTEM_NAMES[system]}</h3>
      <ol className="flex flex-col gap-5">
        {SYSTEM_MOVES[system].map((move, rank) => {
          const said = i18n._(move)

          return (
            <li key={said} className="flex items-baseline gap-4">
              <span
                aria-hidden
                className="font-carve text-chapter text-leaf-lit"
              >
                {rank + 1}
              </span>
              <span className="text-tale text-band">{said}</span>
            </li>
          )
        })}
      </ol>
    </Plate>
  )
}
