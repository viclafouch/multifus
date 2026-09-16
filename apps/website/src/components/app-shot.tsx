import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import type { Picture } from '@/@types/media'

type AppShotProps = Readonly<{
  shot: Picture
  alt: MessageDescriptor
}>

export const AppShot = ({ shot, alt }: AppShotProps) => {
  const { i18n } = useLingui()

  return (
    <img
      src={shot.src}
      alt={i18n._(alt)}
      width={shot.width}
      height={shot.height}
      className="stage h-auto w-full"
    />
  )
}
