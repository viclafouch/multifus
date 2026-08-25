import React from 'react'

type NoteProps = Readonly<{
  children: React.ReactNode
}>

export const Note = ({ children }: NoteProps) => {
  return (
    <p className="mt-4 max-w-prose border-l-2 border-border pl-3 text-note text-muted-foreground/85">
      {children}
    </p>
  )
}
