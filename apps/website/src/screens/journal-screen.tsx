import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'
import type { ChangelogRelease } from '@/helpers/changelog'
import { releasesOf } from '@/helpers/changelog'
import { formatDate } from '@/helpers/day'
import { useLanguage } from '@/hooks/use-language'

const NOTHING_YET = msg`La première version de Multifus n’est pas encore publiée.`

const VERSION_PREFIX = msg`Version`

export const JournalScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const releases = releasesOf(__CHANGELOG__[language])
  const { kin } = PAGES[page]

  const titleOf = ({ version, day }: ChangelogRelease) => {
    const named = `${i18n._(VERSION_PREFIX)} ${version}`

    return day === null
      ? named
      : `${named} · ${formatDate({ day, locale: language })}`
  }

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pt-rest-sm pb-8">
        <PageHead page={page} />
      </Band>
      <Band className="reveal gap-8 pb-rest-lg">
        {releases.length === 0 ? (
          <Prose isWide>{i18n._(NOTHING_YET)}</Prose>
        ) : null}
        {releases.map((release) => {
          return (
            <ProseBlock
              key={release.version}
              level={2}
              title={titleOf(release)}
            >
              {release.sections.map((section) => {
                return (
                  <div key={section.title} className="flex flex-col gap-2">
                    <h3 className="nameplate">{section.title}</h3>
                    <ul className="flex list-disc flex-col gap-2 pl-5">
                      {section.lines.map((line) => {
                        return (
                          <li
                            key={line}
                            className="max-w-saga text-tale text-band"
                          >
                            {line}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </ProseBlock>
          )
        })}
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
