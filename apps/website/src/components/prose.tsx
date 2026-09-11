import React from 'react'

type ProseProps = Readonly<{
  children: React.ReactNode
}>

export const Prose = ({ children }: ProseProps) => {
  return (
    <p className="max-w-tale text-tale text-muted-foreground">{children}</p>
  )
}
