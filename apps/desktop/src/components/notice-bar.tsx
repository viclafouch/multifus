import React from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'

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
      className="relative z-30 shrink-0 border-b-2 border-flame/45 bg-iron/95 px-6 py-3"
    >
      <div className="flex items-center gap-3">
        <TriangleAlert
          aria-hidden
          className="size-4 shrink-0 text-flame"
          strokeWidth={1.9}
        />
        <p className="min-w-0 flex-1 text-tale font-medium text-cream">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
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
      <div className="mt-1 flex flex-col gap-1 pl-7">
        <p className="max-w-tale text-aside text-khaki">{body}</p>
        {children}
      </div>
    </div>
  )
}
