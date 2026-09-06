import type { MapName } from '@/constants/world'
import { CLEARING, MAP_SCENES } from '@/constants/world'

type WorldSceneProps = Readonly<{
  map: MapName
}>

export const WorldScene = ({ map }: WorldSceneProps) => {
  return (
    <div aria-hidden className="grove pointer-events-none absolute inset-0">
      {Object.entries(MAP_SCENES).map(([name, source]) => {
        return (
          <img
            key={name}
            src={source}
            alt=""
            data-here={name === map ? '' : undefined}
            className="roam absolute inset-0 size-full object-cover"
          />
        )
      })}
      <div className="veil absolute inset-0" />
      <div
        data-here={map === CLEARING ? '' : undefined}
        className="flank absolute inset-y-0 left-0 w-1/2"
      />
      <div
        data-deep={map === CLEARING ? undefined : ''}
        className="deepen absolute inset-0"
      />
      <div className="grain absolute inset-0" />
    </div>
  )
}
