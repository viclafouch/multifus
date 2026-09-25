import { Download, Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import type { ReleaseNotice, UpdateStatus } from '@/@types/system'
import { LinkButton } from '@/components/link-button'
import { NoticeBar } from '@/components/notice-bar'
import { arrivedNoticeLines, readyNoticeLines } from '@/helpers/wording'
import {
  dismissReleaseNotice,
  installUpdate,
  openReleaseNotes
} from '@/lib/multifus'

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
  update: UpdateStatus
  run: Run
}>

const ReadyNotice = ({ version, update, run }: ReadyNoticeProps) => {
  const { title, body, installLabel } = readyNoticeLines(version, update)
  const canWait = update.kind !== 'installing'

  return (
    <NoticeBar
      level="news"
      icon={Download}
      title={title}
      body={body}
      action={
        installLabel === null
          ? undefined
          : {
              label: installLabel,
              onAct: () => {
                run(installUpdate())
              }
            }
      }
      secondaryAction={
        <>
          <PatchNoteButton />
          {canWait ? (
            <Button
              variant="slate"
              size="tight"
              onClick={() => {
                run(dismissReleaseNotice())
              }}
            >
              {t`Plus tard`}
            </Button>
          ) : null}
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
  update: UpdateStatus
  run: Run
}>

export const ReleaseNoticeBar = ({
  notice,
  update,
  run
}: ReleaseNoticeBarProps) => {
  switch (notice.kind) {
    case 'ready': {
      return <ReadyNotice version={notice.version} update={update} run={run} />
    }
    case 'arrived': {
      return <ArrivedNotice version={notice.version} run={run} />
    }
    default: {
      return notice satisfies never
    }
  }
}
