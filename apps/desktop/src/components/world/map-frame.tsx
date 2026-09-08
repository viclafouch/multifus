import React from 'react'
import type { LoopsSeen } from '@/@types/loop'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import { MapLoop } from '@/components/world/map-loop'
import { WayBack } from '@/components/world/way-back'
import { MAP_LOOPS } from '@/constants/loops'

type MapFrameProps = Readonly<{
  map: ScreenName
  loopsSeen: LoopsSeen
  onLeave: () => void
  run: (action: Promise<Snapshot>) => void
  children: React.ReactNode
}>

export const MapFrame = ({
  map,
  loopsSeen,
  onLeave,
  run,
  children
}: MapFrameProps) => {
  const loop = MAP_LOOPS[map]

  return (
    <>
      <header className="absolute top-3 left-6 z-30 flex items-center gap-2">
        <WayBack onGo={onLeave} />
        {loop === null ? null : (
          <MapLoop
            key={loop.name}
            loop={loop}
            isSeen={loopsSeen[loop.name]}
            run={run}
          />
        )}
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-6">
        <div key={map} className="flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </>
  )
}
