import React from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@/components/retro/button'

type NoticeBarProps = Readonly<{
  title: string
  body: string
  onDismiss: () => void
  actionLabel?: string
  onAct?: () => void
  children?: React.ReactNode
}>

export const NoticeBar = ({
  title,
  body,
  onDismiss,
  actionLabel,
  onAct,
  children
}: NoticeBarProps) => {
  return (
    <div
      role="alert"
      className="relative z-30 flex items-start gap-3 border-b-2 border-flame/45 bg-iron/95 py-3 pr-44 pl-28"
    >
      <TriangleAlert
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-flame"
        strokeWidth={1.9}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-tale font-medium text-cream">{title}</p>
        <p className="max-w-tale text-aside text-khaki">{body}</p>
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-center">
        {actionLabel === undefined ? null : (
          <Button variant="slate" size="tight" onClick={onAct}>
            {actionLabel}
          </Button>
        )}
        <Button variant="slate" size="tight" onClick={onDismiss}>
          {t`J’ai compris`}
        </Button>
      </div>
    </div>
  )
}
