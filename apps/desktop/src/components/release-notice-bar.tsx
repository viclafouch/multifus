import { Download, Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import type { ReleaseNotice } from '@/@types/system'
import { DownloadButton } from '@/components/download-button'
import { LinkButton } from '@/components/link-button'
import { NoticeBar } from '@/components/notice-bar'
import { arrivedNoticeLines, publishedNoticeLines } from '@/helpers/wording'
import { dismissReleaseNotice, openReleaseNotes } from '@/lib/multifus'

type Run = (action: Promise<Snapshot>) => void

const PatchNoteButton = () => {
  return (
    <LinkButton
      label={t`Voir le patch note`}
      size="tight"
      onOpen={openReleaseNotes}
    />
  )
}

type PublishedNoticeProps = Readonly<{
  version: string
  run: Run
}>

const PublishedNotice = ({ version, run }: PublishedNoticeProps) => {
  const { title, body } = publishedNoticeLines(version)

  return (
    <NoticeBar
      level="news"
      icon={Download}
      title={title}
      body={body}
      secondaryAction={
        <>
          <PatchNoteButton />
          <Button
            variant="slate"
            size="tight"
            onClick={() => {
              run(dismissReleaseNotice())
            }}
          >
            {t`Plus tard`}
          </Button>
          <DownloadButton variant="leaf" size="tight" />
        </>
      }
    />
  )
}

type ArrivedNoticeProps = Readonly<{
  version: string
  run: Run
}>

const ArrivedNotice = ({ version, run }: ArrivedNoticeProps) => {
  const { title, body } = arrivedNoticeLines(version)

  return (
    <NoticeBar
      level="news"
      icon={Sparkles}
      title={title}
      body={body}
      secondaryAction={<PatchNoteButton />}
      onDismiss={() => {
        run(dismissReleaseNotice())
      }}
    />
  )
}

type ReleaseNoticeBarProps = Readonly<{
  notice: ReleaseNotice
  run: Run
}>

export const ReleaseNoticeBar = ({ notice, run }: ReleaseNoticeBarProps) => {
  switch (notice.kind) {
    case 'published': {
      return <PublishedNotice version={notice.version} run={run} />
    }
    case 'arrived': {
      return <ArrivedNotice version={notice.version} run={run} />
    }
    default: {
      return notice satisfies never
    }
  }
}
