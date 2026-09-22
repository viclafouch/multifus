import { preload } from 'react-dom'
import type { Decor } from '@/@types/media'
import { UPRIGHT } from '@/lib/media'

type SiteWorldProps = Readonly<{
  decor: Decor
}>

const NOT_UPRIGHT = `not all and ${UPRIGHT}`

export const SiteWorld = ({ decor }: SiteWorldProps) => {
  const { wide, upright } = decor

  preload(upright.src, { as: 'image', fetchPriority: 'high', media: UPRIGHT })
  preload(wide.src, { as: 'image', fetchPriority: 'high', media: NOT_UPRIGHT })

  return (
    <div aria-hidden className="world">
      <picture className="contents">
        <source
          media={UPRIGHT}
          srcSet={upright.src}
          width={upright.width}
          height={upright.height}
        />
        <img
          src={wide.src}
          alt=""
          width={wide.width}
          height={wide.height}
          fetchPriority="high"
          className="decor size-full object-cover"
        />
      </picture>
      <div className="gloam absolute inset-0" />
    </div>
  )
}
