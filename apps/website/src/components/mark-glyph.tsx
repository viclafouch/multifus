import { useLingui } from '@lingui/react'
import type { Mark } from '@/@types/rival'
import { MARK_NAMES } from '@/constants/rivals'

type MarkGlyphProps = Readonly<{
  mark: Mark
  isMute?: boolean
}>

export const MarkGlyph = ({ mark, isMute = false }: MarkGlyphProps) => {
  const { i18n } = useLingui()

  if (isMute) {
    return (
      <svg aria-hidden data-mark={mark} viewBox="0 0 24 24" className="mark">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 000 16Z" />
      </svg>
    )
  }

  return (
    <svg
      data-mark={mark}
      viewBox="0 0 24 24"
      role="img"
      aria-label={i18n._(MARK_NAMES[mark])}
      className="mark"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 000 16Z" />
    </svg>
  )
}
