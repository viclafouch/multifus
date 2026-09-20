import type { Picture } from '@/@types/media'

type SiteWorldProps = Readonly<{
  decor: Picture
}>

export const SiteWorld = ({ decor }: SiteWorldProps) => {
  return (
    <div aria-hidden className="world">
      <img
        src={decor.src}
        alt=""
        width={decor.width}
        height={decor.height}
        fetchPriority="high"
        className="decor size-full object-cover"
      />
      <div className="gloam absolute inset-0" />
    </div>
  )
}
