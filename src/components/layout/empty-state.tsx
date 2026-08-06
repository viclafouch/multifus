import React from 'react'

type EmptyStateProps = Readonly<{
  title: string
  body: string
  hint?: string
  mark?: React.ReactNode
  children: React.ReactNode
}>

/**
 * The dashed panel a screen shows instead of its content. Two screens need it
 * identical: the roster nobody has filled, and the one the system hides.
 */
export const EmptyState = ({
  title,
  body,
  hint,
  mark,
  children
}: EmptyStateProps) => {
  return (
    <div className="flex min-h-empty flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-8 py-14 text-center">
      {mark === undefined ? null : mark}
      <h2 className="font-display text-heading font-semibold tracking-title">
        {title}
      </h2>
      <p className="max-w-blurb text-body text-muted-foreground">{body}</p>
      {hint === undefined ? null : (
        <p className="max-w-blurb text-note text-muted-foreground/70">{hint}</p>
      )}
      <div className="mt-3 flex items-center gap-2">{children}</div>
    </div>
  )
}
