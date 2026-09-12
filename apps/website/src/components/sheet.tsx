import React from 'react'

type SheetProps = Readonly<{
  children: React.ReactNode
}>

export const Sheet = ({ children }: SheetProps) => {
  return <div className="sheet relative flex flex-col">{children}</div>
}
