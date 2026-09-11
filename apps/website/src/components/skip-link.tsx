import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { CONTENT_ANCHOR } from '@/constants/site'

const SKIP_TO_CONTENT = msg`Aller au contenu`

export const SkipLink = () => {
  const { i18n } = useLingui()

  return (
    <a
      href={`#${CONTENT_ANCHOR}`}
      className="plate sighted absolute top-2 left-2 z-50 -translate-y-[200%] px-4 py-2 text-way focus:translate-y-0"
    >
      {i18n._(SKIP_TO_CONTENT)}
    </a>
  )
}
