import { useLingui } from '@lingui/react'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { CircleHalfIcon } from '@phosphor-icons/react/dist/ssr/CircleHalf'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'
import type { Mark } from '@/@types/rival'
import { MARK_NAMES } from '@/constants/rivals'

type MarkSign = Readonly<{
  icon: Icon
  weight: IconWeight
}>

const MARK_SIGNS = {
  yes: { icon: CheckCircleIcon, weight: 'fill' },
  half: { icon: CircleHalfIcon, weight: 'bold' },
  no: { icon: XCircleIcon, weight: 'bold' }
} as const satisfies Record<Mark, MarkSign>

type MarkGlyphProps = Readonly<{
  mark: Mark
}>

export const MarkGlyph = ({ mark }: MarkGlyphProps) => {
  const { i18n } = useLingui()
  const { icon: SignIcon, weight } = MARK_SIGNS[mark]

  return (
    <SignIcon
      data-mark={mark}
      weight={weight}
      role="img"
      aria-label={i18n._(MARK_NAMES[mark])}
      className="mark"
    />
  )
}
