import { FolderOpen, TriangleAlert } from 'lucide-react'
import type { ConfigProblem } from '@/@types/system'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { CONFIG_PROBLEM_LINES } from '@/helpers/wording'

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
  const { title, body } = CONFIG_PROBLEM_LINES[problem.kind]

  return (
    <div className="flex items-start gap-3 border-b border-destructive/25 bg-destructive/8 px-7 py-3">
      <TriangleAlert
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-destructive"
        strokeWidth={1.9}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body font-medium">{title}</p>
        <p className="max-w-prose text-note text-muted-foreground">{body}</p>
        {quarantined === null ? null : (
          <p className="selectable font-mono text-mini break-all text-muted-foreground/75">
            {quarantined}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {quarantined === null ? null : (
          <Button variant="outline" size="xs" onClick={onReveal}>
            <FolderOpen aria-hidden />
            {strings.config.reveal}
          </Button>
        )}
        <Button variant="ghost" size="xs" onClick={onDismiss}>
          {strings.config.dismiss}
        </Button>
      </div>
    </div>
  )
}
