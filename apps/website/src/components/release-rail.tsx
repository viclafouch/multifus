import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { ChangelogRelease } from '@/helpers/changelog'
import { anchorOf } from '@/helpers/changelog'
import { formatDate } from '@/helpers/day'
import { useLanguage } from '@/hooks/use-language'

const EVERY_VERSION = msg`Toutes les versions`

const RAIL_TITLE_ID = 'every-version'

type ReleaseRailProps = Readonly<{
  releases: readonly ChangelogRelease[]
}>

export const ReleaseRail = ({ releases }: ReleaseRailProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <nav
      aria-labelledby={RAIL_TITLE_ID}
      className="flex flex-col gap-3 lg:sticky lg:top-fall lg:self-start"
    >
      <h2 id={RAIL_TITLE_ID} className="rubric text-khaki">
        {i18n._(EVERY_VERSION)}
      </h2>
      <ol className="flex flex-wrap gap-x-6 gap-y-3 lg:flex-col">
        {releases.map(({ version, day }) => {
          return (
            <li key={version}>
              <a
                href={`#${anchorOf(version)}`}
                className="sighted group flex flex-col"
              >
                <span className="font-carve text-bar text-khaki transition-colors group-hover:text-cream">
                  {version}
                </span>
                {day === null ? null : (
                  <span className="text-aside text-band">
                    {formatDate({ day, locale: language })}
                  </span>
                )}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
