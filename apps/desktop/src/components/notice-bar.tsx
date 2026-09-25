import React from 'react'
import { type LucideIcon, TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button, type ButtonLook, cn } from '@multifus/retro'

type NoticeLevel = 'alarm' | 'news' | 'notice'

type NoticeLook = {
  readonly role: 'alert' | 'status'
  readonly bar: string
  readonly row: string
  readonly mark: string
  readonly icon: string
  readonly title: string
  readonly body: string
  readonly action: ButtonLook
}

const NOTICE_LOOKS = {
  notice: {
    role: 'alert',
    bar: 'border-flame/45 py-3',
    row: 'gap-3',
    mark: 'text-flame',
    icon: 'size-4',
    title: 'text-tale font-medium text-cream',
    body: 'pl-7',
    action: { variant: 'slate', size: 'tight' }
  },
  news: {
    role: 'status',
    bar: 'border-live/45 py-3',
    row: 'gap-3',
    mark: 'text-live',
    icon: 'size-4',
    title: 'text-tale font-medium text-cream',
    body: 'pl-7',
    action: { variant: 'leaf', size: 'tight' }
  },
  alarm: {
    role: 'alert',
    bar: 'alarm border-flame/55 py-3.5',
    row: 'gap-4',
    mark: 'grid size-10 place-items-center rounded-full border-2 border-flame/45 bg-flame/12 text-flame',
    icon: 'size-5',
    title:
      'limelight font-carve text-action tracking-wide text-cream uppercase',
    body: 'pl-14',
    action: { variant: 'leaf', size: 'default' }
  }
} as const satisfies Record<NoticeLevel, NoticeLook>

type NoticeAction = Readonly<{
  label: string
  onAct: () => void
}>

type NoticeBarProps = Readonly<{
  title: string
  body: string
  level?: NoticeLevel
  icon?: LucideIcon
  action?: NoticeAction
  secondaryAction?: React.ReactNode
  onDismiss?: () => void
  children?: React.ReactNode
}>

export const NoticeBar = ({
  title,
  body,
  level = 'notice',
  icon: Icon = TriangleAlert,
  action,
  secondaryAction,
  onDismiss,
  children
}: NoticeBarProps) => {
  const look = NOTICE_LOOKS[level]

  return (
    <div
      role={look.role}
      className={cn(
        'relative border-y-2 bg-iron/95 px-6 shadow-lg shadow-black/40',
        look.bar
      )}
    >
      <div className={cn('flex items-center', look.row)}>
        <span aria-hidden className={cn('shrink-0', look.mark)}>
          <Icon className={look.icon} strokeWidth={1.9} />
        </span>
        <p className={cn('min-w-0 flex-1', look.title)}>{title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {secondaryAction}
          {action === undefined ? null : (
            <Button
              {...look.action}
              onClick={() => {
                action.onAct()
              }}
            >
              {action.label}
            </Button>
          )}
          {onDismiss === undefined ? null : (
            <Button variant="leaf" size="tight" onClick={onDismiss}>
              {t`J’ai compris`}
            </Button>
          )}
        </div>
      </div>
      <div className={cn('mt-1 flex flex-col gap-1', look.body)}>
        <p className="max-w-tale text-aside text-khaki">{body}</p>
        {children}
      </div>
    </div>
  )
}
