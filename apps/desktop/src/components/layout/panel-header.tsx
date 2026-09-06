import React from 'react'

type PanelHeaderProps = Readonly<{
  title: string
  description: string
  children?: React.ReactNode
}>

export const PanelHeader = ({
  title,
  description,
  children
}: PanelHeaderProps) => {
  return (
    <div className="flex items-center gap-4 border-b border-band/25 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-carve text-bar tracking-wide text-cream uppercase">
          {title}
        </h2>
        <p className="max-w-tale text-aside text-khaki">{description}</p>
      </div>
      {children === undefined ? null : (
        <div className="flex shrink-0 items-center gap-1.5">{children}</div>
      )}
    </div>
  )
}
