import React from 'react'

type SectionRowProps = Readonly<{
  title: string
  description: string
  children: React.ReactNode
}>

export const SectionRow = ({
  title,
  description,
  children
}: SectionRowProps) => {
  return (
    <section className="flex items-center gap-5 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-carve text-bar tracking-wide text-cream uppercase">
          {title}
        </h2>
        <p className="max-w-tale text-pretty text-aside text-khaki">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </section>
  )
}
