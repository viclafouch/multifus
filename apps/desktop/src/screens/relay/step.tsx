import type { RelayLink } from '@/@types/relay'
import { LinkButton } from '@/components/link-button'
import { openRelayLink } from '@/lib/multifus'

type StepProps = Readonly<{
  rank: number
  title: string
  body: string
  link?: RelayLink
  action?: string
}>

export const Step = ({ rank, title, body, link, action }: StepProps) => {
  return (
    <li className="flex items-start gap-3.5 px-4 py-2">
      <span
        aria-hidden
        className="w-5 shrink-0 pt-1 text-right font-mono text-log tabular-nums text-khaki/45"
      >
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-0.5">
        <p className="text-tale font-medium text-cream">{title}</p>
        <p className="max-w-tale text-aside text-khaki">{body}</p>
      </div>
      {link === undefined || action === undefined ? null : (
        <LinkButton
          label={action}
          onOpen={() => {
            return openRelayLink(link)
          }}
        />
      )}
    </li>
  )
}
