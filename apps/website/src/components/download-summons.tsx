import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { SummonsShape, Summons } from '@/@types/summons'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'

type ShapeLook = Readonly<{
  band: string
  text: string
}>

const SHAPE_LOOKS = {
  stack: {
    band: 'items-start gap-8 py-rest-lg',
    text: 'items-start'
  },
  split: {
    band: 'items-start gap-7 py-rest lg:flex-row lg:items-center lg:gap-14',
    text: 'items-start'
  },
  center: {
    band: 'gap-6 py-rest-sm lg:items-center lg:text-center',
    text: 'items-start lg:items-center'
  }
} as const satisfies Record<SummonsShape, ShapeLook>

type DownloadSummonsProps = Readonly<{
  summons: Summons
}>

export const DownloadSummons = ({ summons }: DownloadSummonsProps) => {
  const { i18n } = useLingui()
  const { decor, shape, title, line } = summons
  const look = SHAPE_LOOKS[shape]

  return (
    <div className="summons" data-shape={shape}>
      <img
        aria-hidden
        alt=""
        src={decor.src}
        width={decor.width}
        height={decor.height}
        loading="lazy"
        decoding="async"
      />
      <Band className={cn('reveal', look.band)}>
        <div className={cn('flex flex-col gap-5 lg:flex-1', look.text)}>
          <h2 className="carved max-w-lintel text-balance text-chapter">
            {i18n._(title)}
          </h2>
          <p className="max-w-blurb text-herald text-khaki">{i18n._(line)}</p>
        </div>
        <DownloadButton />
      </Band>
    </div>
  )
}
