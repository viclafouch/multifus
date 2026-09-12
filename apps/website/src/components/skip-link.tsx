import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { CONTENT_ANCHOR } from '@/constants/site'

const SKIP_TO_CONTENT = msg`Aller au contenu`

export const SkipLink = () => {
  const { i18n } = useLingui()

  return (
    <a
      href={`#${CONTENT_ANCHOR}`}
      className="canopy sighted sr-only text-deed focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
    >
      {i18n._(SKIP_TO_CONTENT)}
    </a>
  )
}
