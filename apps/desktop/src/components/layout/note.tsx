import React from 'react'
import { cn } from '@multifus/retro'

type NoteProps = Readonly<{
  children: React.ReactNode
  isWarning?: boolean
  className?: string
}>

export const Note = ({ children, isWarning = false, className }: NoteProps) => {
  return (
    <aside
      className={cn(
        'note flex max-w-tale items-start gap-2.5 px-3.5 py-2.5',
        isWarning ? 'note-warning' : null,
        className
      )}
    >
      <p className={cn('text-aside', isWarning ? 'text-amber' : 'text-khaki')}>
        {children}
      </p>
    </aside>
  )
}
