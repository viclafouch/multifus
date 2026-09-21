import { cn } from '@multifus/retro'
import type { SystemId } from '@/@types/system'
import { SystemShot } from '@/components/system-shot'
import { SYSTEM_IDS } from '@/constants/systems'

type SystemSwapProps = Readonly<{
  shown: SystemId
  hasPicked: boolean
}>

export const SystemSwap = ({ shown, hasPicked }: SystemSwapProps) => {
  return (
    <div className="grid">
      {SYSTEM_IDS.map((system) => {
        const isShown = system === shown

        return (
          <div
            key={system}
            aria-hidden={isShown ? undefined : true}
            className={cn(
              'col-start-1 row-start-1',
              hasPicked
                ? 'transition-opacity duration-300 motion-reduce:transition-none'
                : null,
              isShown ? 'opacity-100' : 'opacity-0'
            )}
          >
            <SystemShot system={system} />
          </div>
        )
      })}
    </div>
  )
}
