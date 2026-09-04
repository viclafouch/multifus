import { FolderOpen } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { ConfigProblem } from '@/@types/system'
import { NoticeBar } from '@/components/notice-bar'
import { Button } from '@/components/ui/button'
import { configProblemLines } from '@/helpers/wording'

type ConfigNoticeProps = Readonly<{
  problem: ConfigProblem
  quarantined: string | null
  onReveal: () => void
  onDismiss: () => void
}>

export const ConfigNotice = ({
  problem,
  quarantined,
  onReveal,
  onDismiss
}: ConfigNoticeProps) => {
  const { title, body } = configProblemLines(problem.kind)

  return (
    <NoticeBar
      title={title}
      body={body}
      onDismiss={onDismiss}
      actions={
        quarantined === null ? null : (
          <Button variant="outline" size="xs" onClick={onReveal}>
            <FolderOpen aria-hidden />
            {t`Montrer le fichier`}
          </Button>
        )
      }
    >
      {quarantined === null ? null : (
        <p className="selectable font-mono text-mini break-all text-muted-foreground/75">
          {quarantined}
        </p>
      )}
    </NoticeBar>
  )
}
