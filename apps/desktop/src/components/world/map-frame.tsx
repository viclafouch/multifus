import React from 'react'
import { WayBack } from '@/components/world/way-back'
import type { MapName } from '@/constants/world'

type MapFrameProps = Readonly<{
  map: MapName
  onLeave: () => void
  children: React.ReactNode
}>

export const MapFrame = ({ map, onLeave, children }: MapFrameProps) => {
  return (
    <>
      <header className="absolute top-3 left-6 z-30">
        <WayBack onGo={onLeave} />
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-6">
        <div key={map} className="flex w-full flex-1 flex-col">
          {children}
        </div>
      </main>
    </>
  )
}
