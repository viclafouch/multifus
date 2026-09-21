import { useLingui } from '@lingui/react'
import type { SystemId } from '@/@types/system'
import { SYSTEM_SHOTS, SYSTEM_SHOT_ALTS } from '@/constants/shots'
import { useLanguage } from '@/hooks/use-language'
import { WIDE_FLOOR } from '@/lib/media'

const SHOT_COLUMN = '39.5rem'

const SHOT_GUTTER = '2rem'

const SHOT_SIZES = `(min-width: ${WIDE_FLOOR}) ${SHOT_COLUMN}, calc(100vw - ${SHOT_GUTTER})`

type SystemShotProps = Readonly<{
  system: SystemId
}>

export const SystemShot = ({ system }: SystemShotProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const { full, small } = SYSTEM_SHOTS[system][language]

  return (
    <img
      src={full.src}
      srcSet={`${small.src} ${small.width}w, ${full.src} ${full.width}w`}
      sizes={SHOT_SIZES}
      alt={i18n._(SYSTEM_SHOT_ALTS[system])}
      width={full.width}
      height={full.height}
      className="h-auto w-full"
    />
  )
}
