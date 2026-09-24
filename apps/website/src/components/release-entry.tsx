import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { ChangelogRelease } from '@/helpers/changelog'
import { anchorOf } from '@/helpers/changelog'
import { formatDate } from '@/helpers/day'
import { useLanguage } from '@/hooks/use-language'

const VERSION_PREFIX = msg`Version`

const LATEST = msg`Dernière version`

type ReleaseEntryProps = Readonly<{
  release: ChangelogRelease
  isLatest: boolean
}>

export const ReleaseEntry = ({ release, isLatest }: ReleaseEntryProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const { version, day, sections } = release

  return (
    <article
      id={anchorOf(version)}
      className="rule flex scroll-mt-fall flex-col gap-8 border-t pt-rest-xs"
    >
      <header className="flex flex-col gap-2">
        {isLatest ? (
          <p className="rubric text-khaki">{i18n._(LATEST)}</p>
        ) : null}
        <h2 className="carved text-chapter">
          {i18n._(VERSION_PREFIX)} {version}
        </h2>
        {day === null ? null : (
          <time dateTime={day} className="engraved text-aside text-khaki">
            {formatDate({ day, locale: language })}
          </time>
        )}
      </header>
      {sections.map((section) => {
        return (
          <section key={section.title} className="flex flex-col gap-3">
            <h3 className="font-carve text-bar tracking-wide text-khaki-lit uppercase">
              {section.title}
            </h3>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {section.lines.map((line) => {
                return (
                  <li key={line} className="max-w-saga text-tale text-band">
                    {line}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </article>
  )
}
