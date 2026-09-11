import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { OutLink } from '@/components/out-link'
import { ANKAMA_FORUM, ANKAMA_POST } from '@/constants/site'

const ANKAMA_POST_NAME = msg`le compte Dofus Retro sur X, le 10 mars 2026`

const ANKAMA_FORUM_NAME = msg`le forum de Dofus Retro, le 1ᵉʳ avril 2026`

export const AnkamaSources = () => {
  const { i18n } = useLingui()

  return (
    <ul className="flex flex-col gap-2 text-tale">
      <li>
        <OutLink href={ANKAMA_POST}>{i18n._(ANKAMA_POST_NAME)}</OutLink>
      </li>
      <li>
        <OutLink href={ANKAMA_FORUM}>{i18n._(ANKAMA_FORUM_NAME)}</OutLink>
      </li>
    </ul>
  )
}
