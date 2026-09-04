import React from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@/components/ui/button'

type NoticeBarProps = Readonly<{
  title: string
  body: string
  onDismiss: () => void
  actions?: React.ReactNode
  children?: React.ReactNode
}>

export const NoticeBar = ({
  title,
  body,
  onDismiss,
  actions,
  children
}: NoticeBarProps) => {
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
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-center">
        {actions}
        <Button variant="ghost" size="xs" onClick={onDismiss}>
          {t`J’ai compris`}
        </Button>
      </div>
    </div>
  )
}
