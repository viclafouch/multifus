import { useLingui } from '@lingui/react'
import type { SystemId } from '@/@types/system'
import { SYSTEM_SHOTS, SYSTEM_SHOT_ALTS } from '@/constants/shots'
import { useLanguage } from '@/hooks/use-language'
import { GUTTER, sourcesOf, WIDE_FLOOR } from '@/lib/media'

const SHOT_COLUMN = '39.5rem'

const SHOT_SIZES = `(min-width: ${WIDE_FLOOR}) ${SHOT_COLUMN}, calc(100vw - ${GUTTER})`

type SystemShotProps = Readonly<{
  system: SystemId
}>

export const SystemShot = ({ system }: SystemShotProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const shot = SYSTEM_SHOTS[system][language]

  return (
    <img
      src={shot.full.src}
      srcSet={sourcesOf(shot)}
      sizes={SHOT_SIZES}
      alt={i18n._(SYSTEM_SHOT_ALTS[system])}
      width={shot.full.width}
      height={shot.full.height}
      className="h-auto w-full"
    />
  )
}
