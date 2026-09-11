import React from 'react'
import { cn } from '@multifus/retro'

type MarkTone = 'primary' | 'destructive'

const MARK_TONES = {
  primary: 'border-band/45 bg-iron/60 text-khaki',
  destructive: 'border-flame/45 bg-flame/12 text-flame'
} as const satisfies Record<MarkTone, string>

type EmptyStateMarkProps = Readonly<{
  tone: MarkTone
  children: React.ReactNode
}>

export const EmptyStateMark = ({ tone, children }: EmptyStateMarkProps) => {
  return (
    <span
      className={cn(
        'mb-2 flex size-11 items-center justify-center rounded-full border',
        MARK_TONES[tone]
      )}
    >
      {children}
    </span>
  )
}

type EmptyStateProps = Readonly<{
  title: string
  body: string
  hint?: string
  mark?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}>

export const EmptyState = ({
  title,
  body,
  hint,
  mark,
  footer,
  children
}: EmptyStateProps) => {
  return (
    <div className="plate flex min-h-empty flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-8 py-12 text-center">
        {mark === undefined ? null : mark}
        <h2 className="font-carve text-bar tracking-wide text-cream uppercase">
          {title}
        </h2>
        <p className="max-w-blurb text-tale text-khaki">{body}</p>
        {hint === undefined ? null : (
          <p className="max-w-blurb text-aside text-khaki">{hint}</p>
        )}
        <div className="mt-3 flex w-full items-center justify-center gap-2">
          {children}
        </div>
      </div>
      {footer === undefined ? null : (
        <div className="flex items-center justify-center gap-2 border-t border-band/25 px-8 py-3 text-aside text-khaki">
          {footer}
        </div>
      )}
    </div>
  )
}
