import React from 'react'
import type { MapName } from '@/constants/world'
import { ignore } from '@/lib/utils'

const MapNavigationContext = React.createContext<(map: MapName) => void>(ignore)

type MapNavigationProviderProps = Readonly<{
  onGo: (map: MapName) => void
  children: React.ReactNode
}>

export const MapNavigationProvider = ({
  onGo,
  children
}: MapNavigationProviderProps) => {
  return <MapNavigationContext value={onGo}>{children}</MapNavigationContext>
}

export const useGoToMap = () => {
  return React.useContext(MapNavigationContext)
}
