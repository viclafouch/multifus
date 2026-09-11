import { Tale } from '@multifus/retro'
import { MapTitle } from '@/components/layout/map-title'

type MapHeaderProps = Readonly<{
  title: string
  subtitle?: string
}>

export const MapHeader = ({ title, subtitle }: MapHeaderProps) => {
  return (
    <>
      <MapTitle className="self-center text-center text-balance">
        {title}
      </MapTitle>
      {subtitle === undefined ? (
        <span aria-hidden className="crest w-crest self-center" />
      ) : (
        <Tale>{subtitle}</Tale>
      )}
    </>
  )
}
