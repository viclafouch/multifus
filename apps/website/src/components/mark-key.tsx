import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { MarkGlyph } from '@/components/mark-glyph'
import { MARK_IDS, MARK_MEANINGS, MARK_NAMES } from '@/constants/rivals'

const KEY_LABEL = msg`Ce que dit chaque case`

export const MarkKey = () => {
  const { i18n } = useLingui()

  return (
    <ul aria-label={i18n._(KEY_LABEL)} className="flex flex-wrap gap-2.5">
      {MARK_IDS.map((mark) => {
        return (
          <li key={mark} className="keyed">
            <MarkGlyph mark={mark} isMute />
            <span className="text-aside text-band">
              <strong className="font-medium text-cream">
                {i18n._(MARK_NAMES[mark])}
              </strong>{' '}
              {i18n._(MARK_MEANINGS[mark])}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
