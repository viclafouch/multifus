import React from 'react'

type Maps = typeof import('@/screens/current-map')

let loadedMaps: Maps | null = null
let loadingMaps: Promise<Maps> | null = null

export const loadMaps = () => {
  loadingMaps ??= import('@/screens/current-map').then((maps) => {
    loadedMaps = maps

    return maps
  })

  return loadingMaps
}

export const DeferredMap = (
  props: React.ComponentProps<Maps['CurrentMap']>
) => {
  const { CurrentMap } = loadedMaps ?? React.use(loadMaps())

  return <CurrentMap {...props} />
}
