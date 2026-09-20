import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { Picture } from '@/@types/media'

type AppShotProps = Readonly<{
  shot: Picture
  alt: MessageDescriptor
  isBare?: boolean
}>

export const AppShot = ({ shot, alt, isBare = false }: AppShotProps) => {
  const { i18n } = useLingui()

  return (
    <img
      src={shot.src}
      alt={i18n._(alt)}
      width={shot.width}
      height={shot.height}
      className={cn('h-auto w-full', isBare ? null : 'stage')}
    />
  )
}
