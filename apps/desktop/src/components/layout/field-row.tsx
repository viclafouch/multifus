import React from 'react'

type FieldRowProps = Readonly<{
  label: string
  description: string
  mention?: string
  id?: string
  children: React.ReactNode
}>

export const FieldRow = ({
  label,
  description,
  mention,
  id,
  children
}: FieldRowProps) => {
  return (
    <div
      id={id}
      className="flex scroll-mt-24 items-center gap-4 border-b border-band/25 px-4 py-3 last:border-b-0"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-tale leading-snug text-cream">
          {label}
          {mention === undefined ? null : (
            <span className="plaque rounded-xs px-1.5 py-px font-carve text-mark tracking-widest uppercase">
              {mention}
            </span>
          )}
        </p>
        <p className="text-aside text-khaki">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}
