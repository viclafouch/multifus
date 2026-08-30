import React from 'react'

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
    <div className="flex min-h-empty flex-col rounded-xl border border-dashed border-border">
      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-8 py-14 text-center">
        {mark === undefined ? null : mark}
        <h2 className="font-display text-heading font-semibold tracking-title">
          {title}
        </h2>
        <p className="max-w-blurb text-body text-muted-foreground">{body}</p>
        {hint === undefined ? null : (
          <p className="max-w-blurb text-note text-muted-foreground/70">
            {hint}
          </p>
        )}
        <div className="mt-3 flex w-full items-center justify-center gap-2">
          {children}
        </div>
      </div>
      {footer === undefined ? null : (
        <div className="flex items-center justify-center gap-2 border-t border-dashed border-border px-8 py-3 text-note text-muted-foreground/80">
          {footer}
        </div>
      )}
    </div>
  )
}
