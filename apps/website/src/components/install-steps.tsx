import { useLingui } from '@lingui/react'
import type { SystemId } from '@/@types/system'
import { Plate } from '@/components/plate'
import { SYSTEM_MOVES, SYSTEM_NAMES } from '@/constants/systems'

type InstallStepsProps = Readonly<{
  system: SystemId
}>

export const InstallSteps = ({ system }: InstallStepsProps) => {
  const { i18n } = useLingui()

  return (
    <Plate className="gap-8 sm:p-9">
      <h3 className="nameplate">{SYSTEM_NAMES[system]}</h3>
      <ol className="rungs grid gap-7 md:grid-cols-3 md:gap-10">
        {SYSTEM_MOVES[system].map((move, rank) => {
          const said = i18n._(move)

          return (
            <li
              key={said}
              className="stepped flex items-center gap-6 md:flex-col md:gap-5 md:text-center"
            >
              <span aria-hidden className="lozenge relative z-10">
                <span className="font-carve text-action text-cream">
                  {rank + 1}
                </span>
              </span>
              <span className="max-w-tale text-tale text-band">{said}</span>
            </li>
          )
        })}
      </ol>
    </Plate>
  )
}
