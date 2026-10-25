import { Download, Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import type { ReleaseNotice } from '@/@types/system'
import { LinkButton } from '@/components/link-button'
import { NoticeBar } from '@/components/notice-bar'
import { arrivedNoticeLines, readyNoticeLines } from '@/helpers/wording'
import {
  dismissReleaseNotice,
  openAboutLink,
  openReleaseNotes
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'

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

type ReadyNoticeProps = Readonly<{
  version: string
  run: Run
}>

const ReadyNotice = ({ version, run }: ReadyNoticeProps) => {
  const { title, body } = readyNoticeLines(version)

  return (
    <NoticeBar
      level="news"
      icon={Download}
      title={title}
      body={body}
      action={{
        label: t`Télécharger`,
        onAct: () => {
          openAboutLink('download').catch(ignore)
        }
      }}
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
    case 'ready': {
      return <ReadyNotice version={notice.version} run={run} />
    }
    case 'arrived': {
      return <ArrivedNotice version={notice.version} run={run} />
    }
    default: {
      return notice satisfies never
    }
  }
}
