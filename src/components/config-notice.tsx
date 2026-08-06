import { FolderOpen, TriangleAlert } from 'lucide-react'
import type { ConfigProblem } from '@/@types/system'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'

/**
 * One entry per way the file can let multifus down. A table rather than a
 * switch, so that adding a fourth kind on the Rust side fails to compile here
 * instead of falling through to a wrong sentence.
 */
const WORDING = {
  malformed: {
    title: strings.config.malformedTitle,
    body: strings.config.malformedBody
  },
  notSaved: {
    title: strings.config.notSavedTitle,
    body: strings.config.notSavedBody
  },
  notSetAside: {
    title: strings.config.notSetAsideTitle,
    body: strings.config.notSetAsideBody
  },
  unreadable: {
    title: strings.config.unreadableTitle,
    body: strings.config.unreadableBody
  }
} as const satisfies Record<
  ConfigProblem['kind'],
  { readonly title: string; readonly body: string }
>

type ConfigNoticeProps = Readonly<{
  problem: ConfigProblem
  quarantined: string | null
  onReveal: () => void
  onDismiss: () => void
}>

/**
 * What multifus says when its configuration file did not come back.
 *
 * The failure mode this replaces is the worst one the application has: a roster
 * that opens empty, weeks of assigned genders gone, and nothing on screen to say
 * why. So the band sits above every screen, it names the file, and when the file
 * was set aside it offers to show where it went.
 */
export const ConfigNotice = ({
  problem,
  quarantined,
  onReveal,
  onDismiss
}: ConfigNoticeProps) => {
  const { title, body } = WORDING[problem.kind]

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
