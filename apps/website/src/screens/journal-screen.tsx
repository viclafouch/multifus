import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Prose } from '@/components/prose'
import { ReleaseEntry } from '@/components/release-entry'
import { ReleaseRail } from '@/components/release-rail'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'
import { releasesOf } from '@/helpers/changelog'
import { useLanguage } from '@/hooks/use-language'

const NOTHING_YET = msg`La première version de Multifus n’est pas encore publiée.`

const RAIL_FLOOR = 2

export const JournalScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const releases = releasesOf(__CHANGELOG__[language])
  const { kin } = PAGES[page]
  const hasRail = releases.length >= RAIL_FLOOR

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pt-rest-sm pb-8">
        <PageHead page={page} />
      </Band>
      <Band className="reveal pb-rest-lg">
        {releases.length === 0 ? (
          <Prose isWide>{i18n._(NOTHING_YET)}</Prose>
        ) : null}
        <div
          className={
            hasRail
              ? 'grid gap-rest lg:grid-cols-[var(--spacing-side)_minmax(0,1fr)]'
              : 'flex flex-col'
          }
        >
          {hasRail ? <ReleaseRail releases={releases} /> : null}
          <div className="flex flex-col gap-rest-lg">
            {releases.map((release, index) => {
              return (
                <ReleaseEntry
                  key={release.version}
                  release={release}
                  isLatest={index === 0}
                />
              )
            })}
          </div>
        </div>
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
