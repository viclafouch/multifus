import React from 'react'
import { cn } from '@/lib/utils'

type NoteProps = Readonly<{
  children: React.ReactNode
  className?: string
}>

export const Note = ({ children, className }: NoteProps) => {
  return (
    <aside
      className={cn(
        'note flex max-w-tale items-start gap-2.5 px-3.5 py-2.5',
        className
      )}
    >
      <p className="text-aside text-khaki">{children}</p>
    </aside>
  )
}
