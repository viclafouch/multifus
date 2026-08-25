import type { RelayLink } from '@/@types/relay'
import { LinkButton } from '@/screens/relay/link-button'

type StepProps = Readonly<{
  rank: number
  title: string
  body: string
  link?: RelayLink
  action?: string
}>

export const Step = ({ rank, title, body, link, action }: StepProps) => {
  return (
    <li className="flex items-center gap-3.5 px-4 py-2">
      <span
        aria-hidden
        className="w-5 shrink-0 pt-px text-right font-mono text-log tabular-nums text-muted-foreground/45"
      >
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-0.5">
        <p className="text-row font-medium">{title}</p>
        <p className="max-w-prose text-note text-muted-foreground">{body}</p>
      </div>
      {link === undefined || action === undefined ? null : (
        <LinkButton link={link} label={action} />
      )}
    </li>
  )
}
