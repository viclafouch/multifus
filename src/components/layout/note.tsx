import React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type NoteProps = Readonly<{
  children: React.ReactNode
  className?: string
}>

export const Note = ({ children, className }: NoteProps) => {
  return (
    <aside
      className={cn(
        'flex max-w-prose items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/7 px-3.5 py-3',
        className
      )}
    >
      <Info
        aria-hidden
        className="mt-px size-4 shrink-0 text-primary/85"
        strokeWidth={1.9}
      />
      <p className="text-note text-foreground/80">{children}</p>
    </aside>
  )
}
