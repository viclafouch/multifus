import { t } from '@lingui/core/macro'
import type { ConfigProblem } from '@/@types/system'
import { NoticeBar } from '@/components/notice-bar'
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
      actionLabel={quarantined === null ? undefined : t`Montrer le fichier`}
      onAct={onReveal}
      onDismiss={onDismiss}
    >
      {quarantined === null ? null : (
        <p className="selectable font-mono text-log wrap-anywhere text-khaki/75">
          {quarantined}
        </p>
      )}
    </NoticeBar>
  )
}
